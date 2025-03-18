import "./new.scss";
import "../../components/datatable/datatable.scss";
import Sidebar from "../../components/sidebar/Sidebar";
import Navbar from "../../components/navbar/Navbar";
import DriveFolderUploadOutlinedIcon from "@mui/icons-material/DriveFolderUploadOutlined";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { productInputs } from "../../utils/formSource";
import { useForm, useFieldArray } from "react-hook-form";
import { transliterate as slugify } from "transliteration";
import axios from "axios";

const New = ({ title }) => {
  const [singleData, setSingleData] = useState({});
  const [files, setFiles] = useState([]);
  const [per, setPerc] = useState(null);
  const navigate = useNavigate();
  const outerParams = useParams();

  const BASE_URL = process.env.REACT_APP_API_URL;

  const generateSlug = (text) =>
    slugify(text, { replace: { " ": "-", "_": "-" } }).toLowerCase();

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
    const uploadFiles = async () => {
      if (!files.length) return;
  
      try {
        const formData = new FormData();
        files.forEach((file) => formData.append("images", file));
  
        const response = await axios.post(
          `${BASE_URL}/api/upload`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (progressEvent) => {
              const progress =
                (progressEvent.loaded / progressEvent.total) * 100;
              setPerc(progress);
            },
          }
        );
  
        const uploadedImages = response.data.images; // Получаем ссылки на загруженные изображения
        setSingleData((prevData) => ({
          ...prevData,
          images: [...(prevData.images || []), ...uploadedImages],
        }));
      } catch (err) {
        console.error("Error uploading files:", err);
      }
    };
  
    files.length && uploadFiles();
  }, [files]);

  const handleInput = (e) => {
    const id = e.target.id;
    const value = e.target.value;
    setSingleData({ ...singleData, [id]: value });
  };

  const onSubmit = async (data) => {
    try {
        const formData = new FormData();
        files.forEach((file, index) => formData.append("images", file));
        Object.keys(singleData).forEach((key) =>
            formData.append(key, singleData[key])
        );
        Object.keys(data).forEach((key) => formData.append(key, data[key]));

        const url = `${BASE_URL}/api/${outerParams?.categoryId ? "products" : outerParams?.sectionId ? "categories" : "sections"}`;
        if (outerParams?.categoryId) {
          formData.append("parentId", outerParams.categoryId);
        } else if (outerParams?.sectionId) {
          formData.append("parentId", outerParams.sectionId);
        }

        const response = await axios.post(url, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        navigate(-1);
    } catch (err) {
        console.error("Error creating item:", err);
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
                    <img src={`${BASE_URL}${image}`} alt="" />
                  ))
                : (<img src="https://icon-library.com/images/no-image-icon/no-image-icon-0.jpg" alt="" />)
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
