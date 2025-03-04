import "./datatable.scss";
import React, { useEffect, useState } from 'react';
import { DataGrid, GridRow, GridCell } from '@mui/x-data-grid';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { userColumns } from "../../datatablesource";
import DriveFolderUploadOutlinedIcon from "@mui/icons-material/DriveFolderUploadOutlined";
import { Link, useNavigate, useParams } from "react-router-dom";
import { db, storage } from "../../firebase";
import { collection, getDocs, deleteDoc, doc, query, where, serverTimestamp, updateDoc, getDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { productInputs } from "../../formSource";
import { transliterate as slugify } from 'transliteration';

const Datatable = ({ inputs, type }) => {
  const [data, setData] = useState([]);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [update, setUpdate] = useState(false);
  const [singleData, setSingleData] = useState({});
  const [file, setFile] = useState("");
  const [per, setPerc] = useState(null);

  const navigate = useNavigate();
  const outerParams = useParams();

  const generateSlug = (text) => {
    return slugify(text, { replace: { ' ': '-', '_': '-' } }).toLowerCase();
  };

  const formattedValue = (value) => value?.replace(/\s/g, '&nbsp;');

  const getCursorPos = (event) => {
    setPos({ x: event.clientX, y: event.clientY });
  }

  const CustomRowWrapper = ({ row, index, ...rest }) => {
    return (
      <Draggable key={`row-${row.id}`} draggableId={`row-${row.id}`} index={index}>
        {(provided, snapshot) => {
          const element = document.querySelector(".datagrid");
          const rect = element.getBoundingClientRect();
          return(
          <GridRow
            index={index}
            row={row}
            {...rest}
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{
              ...provided.draggableProps.style,
              backgroundColor: snapshot.isDragging ? '#f0f0f0' : 'inherit',
              transform: snapshot.isDragging ? provided.draggableProps.style.transform : 'translate(0px, 0px)',
              top: snapshot.isDragging ? `${pos.y - rect.y - 70}px` : '0',
              left: 0,
            }}
            onMouseMove={(e) => snapshot.isDragging && getCursorPos(e)}
          >
            {userColumns.concat(actionColumn).map((column) => (
              <GridCell key={column.field}>{row[column.field]}</GridCell>
            ))}
          </GridRow>
        )}}
      </Draggable>
    );
  };
  
  const handleDragEnd = (result) => {
    if (!result.destination) return;
  
    const { source, destination } = result;
    const newRows = [...data];
  
    const [removed] = newRows.splice(source.index, 1);
    newRows.splice(destination.index, 0, removed);
    setUpdate(true);
    setData(newRows);
  };


  useEffect(() => {
    const fetchData = async () => {
      try {
        const docs = [...data];
        if (update) {          
          docs.forEach(async (item, index) => {
            const docRef = doc(db, type, item.id);
            await updateDoc(docRef, { order: index + 1 });
          });
        }
      } catch (err) {
        console.log(err);
      } finally {
        setUpdate(false);
      }
    };
    fetchData();
  }, [data]);

  useEffect(() => {
    const fetchData = async () => {
      let list = [];
      try {
        const q = type !== "sections" && query(collection(db, type), where("parentId", "==", type === "categories" ? outerParams.sectionId : outerParams.categoryId));
        const querySnapshot = type !== "sections" ? await getDocs(q) : await getDocs(collection(db, type));
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() })
        });
        if (list[0]?.order) list.sort((a, b) => {
          if (a.order < b.order) {
            return -1;
          }
          if (a.order > b.order) {
            return 1;
          }
          return 0;
        });
        setData(list);


        const docRef = doc(db, type === "categories" ? "sections" : "categories", type === "categories" ? outerParams.sectionId : outerParams.categoryId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSingleData(docSnap.data());
        }
      } catch (err) {
        console.log(err);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, type, id));
      setData(data.filter((item) => item.id !== id));
    } catch (err) {
      console.log(err);
    }
  };

  const tableTitle = type === "sections" ? "Разделы" : type === "categories" ? "Категории" : "Продукты";
  const headerName = type === "sections" ? "Категории" : type === "categories" ? "Продукты" : "";

  const actionColumn = [
    {
      field: "action",
      headerName: headerName,
      width: 200,
      renderCell: (params) => {
        return (
          <div className="cellAction">
            <Link to={
              type === "sections"
              ? `/sections/${params.row.id}/categories` : type === "categories"
              ? `/sections/${outerParams.sectionId}/categories/${params.row.id}/products`
              : `/sections/${outerParams.sectionId}/categories/${outerParams.categoryId}/products/${params.row.id}`
            } style={{ textDecoration: "none" }}>
              <div className="viewButton">Перейти</div>
            </Link>
          </div>
        );
      },
    },
    {
      field: "action2",
      headerName: "",
      width: 200,
      renderCell: (params) => {
        return (
          <div className="cellAction">
            <div
              className="deleteButton"
              onClick={() => handleDelete(params.row.id)}
            >
              Удалить
            </div>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    const uploadFile = () => {
      const name = new Date().getTime() + file.name;

      const storageRef = ref(storage, name);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setPerc(progress);
          switch (snapshot.state) {
            case 'paused':
              console.log('Upload is paused');
              break;
            case 'running':
              console.log('Upload is running');
              break;
            default:
              break;
          }
        }, 
        (error) => {
          console.log(error);
        }, 
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            setSingleData({ ...singleData, images: [downloadURL] });
          });
        }
      );
    };
    file && uploadFile();
  }, [file]);

  const handleInput = (e) => {
    const id = e.target.id;
    const value = e.target.value;

    setSingleData({ ...singleData, [id]: value });
  }

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, type === "categories" ? "sections" : "categories", type === "categories" ? outerParams.sectionId : outerParams.categoryId), {
        ...singleData,
        ...data,
        path: generateSlug(singleData.title),
        timestamp: serverTimestamp()
      });
      navigate(-1);
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div className="datatable">
      {type !== "sections" && (
        <>
          <div className="datatableTitle">
            {singleData['title']}
            <button class="customBtn" onClick={() => navigate(-1)} className="link">Назад</button>
          </div>
          <div className="new">
            <div className="newContainer">
              <div className="bottom">
                  <div className="left">
                    {
                      singleData.images?.length
                      ? singleData.images.map((image) => (
                        <img
                          src={image}
                          alt=""
                        />
                      ))
                      : (<img
                          src="https://icon-library.com/images/no-image-icon/no-image-icon-0.jpg"
                          alt=""
                        />)
                    }
                  </div>
                  <div className="right">
                    <form onSubmit={handleUpdate}>
                      <div className="formInput">
                        <label htmlFor="file">
                          Изображение: <DriveFolderUploadOutlinedIcon className="icon" />
                        </label>
                        <input
                          type="file"
                          id="file"
                          onChange={(e) => setFile(e.target.files[0])}
                          style={{ display: "none" }}
                        />
                      </div>

                      {productInputs.map((input) => (
                        <div className="formInput" key={input.id}>
                          <label>{input.label}</label>
                          { input.id === 'description'
                          ? <textarea value={singleData[input.id]}
                              id={input.id}
                              type={input.type}
                              placeholder={input.placeholder}
                              onChange={handleInput} />
                          : <input
                              value={singleData[input.id]}
                              id={input.id}
                              type={input.type}
                              placeholder={input.placeholder}
                              onChange={handleInput}
                            />
                          }
                        </div>
                      ))}
                      <button class="customBtn" disabled={per !== null && per < 100} type="submit">Изменить</button>
                    </form>
                  </div>
              </div>
            </div>
          </div>
        </>
      )}
      <div className="datatableTitle">
        {tableTitle}
        <Link to={
              type === "sections"
              ? `/sections/new` : type === "categories"
              ? `/sections/${outerParams.sectionId}/categories/new`
              : `/sections/${outerParams.sectionId}/categories/${outerParams.categoryId}/products/new`
            } className="link">
          Добавить
        </Link>
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="droppable-1">
          {(provided) => (
            <DataGrid
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="datagrid"
              rows={data}
              columns={userColumns.concat(actionColumn)}
              pageSize={9}
              rowsPerPageOptions={[9]}
              components={{
                Row: CustomRowWrapper,
              }}
            />
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default Datatable;
