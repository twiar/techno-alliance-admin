import "../new/new.scss";
import "../../components/datatable/datatable.scss";
import Sidebar from "../../components/sidebar/Sidebar";
import Navbar from "../../components/navbar/Navbar";
import DriveFolderUploadOutlinedIcon from "@mui/icons-material/DriveFolderUploadOutlined";
import { useEffect, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, storage } from "../../firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useNavigate, useParams } from "react-router-dom";
import { productInputs } from "../../formSource";
import { useForm, useFieldArray } from "react-hook-form";
import { transliterate as slugify } from 'transliteration';

const New = ({ title }) => {
  const [singleData, setSingleData] = useState({});
  const [files, setFiles] = useState([]);
  const [per, setPerc] = useState(null);

  const navigate = useNavigate();
  const outerParams = useParams();

  const generateSlug = (text) => {
    return slugify(text, { replace: { ' ': '-', '_': '-' } }).toLowerCase();
  };

  const { register, control, handleSubmit } = useForm({
    defaultValues: {
      characteristics: [{ name: "", value: "" }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "characteristics"
  });

  useEffect(() => {
    const images = [];
    const uploadFiles = async () => files.map((file, index) => {
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
            images.push(downloadURL);
            if (index === files.length - 1) setSingleData({ ...singleData, images });
          });
        }
      );
    });
    files.length && uploadFiles();
  }, [files]);

  const handleInput = (e) => {
    const id = e.target.id;
    const value = e.target.value;

    setSingleData({ ...singleData, [id]: value });
  }

  const onSubmit = async (data) => {
    try {
      await addDoc(collection(db, outerParams?.categoryId ? "products" : outerParams?.sectionId ? "categories" : "sections"), {
        parentId: outerParams?.categoryId || outerParams?.sectionId || null,
        ...singleData,
        ...data,
        path: generateSlug(singleData.title),
        timestamp: serverTimestamp()
      });
      navigate(-1);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="new">
      <Sidebar />
      <div className="newContainer">
        <Navbar />
        <div className="datatable">
          <div className="datatableTitle">
            {title}
            <button class="customBtn" onClick={() => navigate(-1)} className="link">Назад</button>
          </div>
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
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="formInput">
                <label htmlFor="file">
                  Изображение: <DriveFolderUploadOutlinedIcon className="icon" />
                </label>
                <input
                  type="file"
                  id="file"
                  onChange={(e) => setFiles(Array.from(e.target.files))}
                  style={{ display: "none" }}
                  multiple
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

              {outerParams?.categoryId && <div className="formInput">
                <label>Характеристики:</label>
                {fields.map((item, index) => (
                  <div key={item.id} style={{ display: 'flex', gap: '20px' }}>
                    <input
                      {...register(`characteristics.${index}.name`)}
                      placeholder="Название"
                    />
                    <input
                      {...register(`characteristics.${index}.value`)}
                      placeholder="Значение"
                    />
                    <button class="customBtn" type="button" onClick={() => remove(index)}>Удалить</button>
                  </div>
                ))}
                <button class="customBtn" type="button" onClick={() => append({ name: "", value: "" })}>
                  Добавить характеристику
                </button>
              </div>}
              <button class="customBtn" disabled={per !== null && per < 100} type="submit">Добавить</button>
            </form>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default New;
