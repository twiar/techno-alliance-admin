import "../new/new.scss";
import "../../components/datatable/datatable.scss";
import Sidebar from "../../components/sidebar/Sidebar";
import Navbar from "../../components/navbar/Navbar";
import DriveFolderUploadOutlinedIcon from "@mui/icons-material/DriveFolderUploadOutlined";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { productInputs } from "../../utils/formSource";
import { useForm, useFieldArray } from "react-hook-form";
import { transliterate as slugify } from "transliteration";
import { Editor } from "@tinymce/tinymce-react";
import axios from "axios";

const Single = () => {
  const [singleData, setSingleData] = useState({});
  const [editorContent, setEditorContent] = useState("");
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

  const formattedValue = (value) => value?.replace(/\s/g, '&nbsp;');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/api/products/${outerParams.productId}`
        );
        const product = response.data;
  
        setSingleData(product);
        if (product.characteristics) {
          product.characteristics.forEach((charact) => {
            append({ name: charact.name, value: charact.value });
          });
        }
      } catch (err) {
        console.error("Error fetching product:", err);
      }
    };
  
    fetchData();
  }, [outerParams.productId]);

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

  const handleEditorChange = (content) => {
    setEditorContent(content);
  };

  const onSubmit = async (data) => {
    try {
        const formData = new FormData();
        files.forEach((file) => formData.append("images", file));
        Object.keys(singleData).forEach((key) =>
            formData.append(key, singleData[key])
        );
        Object.keys(data).forEach((key) => formData.append(key, data[key]));
        formData.append("description", editorContent);

        const response = await fetch(
            `${BASE_URL}/api/products/${outerParams.productId}`,
            {
                method: "PUT",
                body: formData,
            }
        );

        navigate(-1);
    } catch (err) {
        console.error("Error updating product:", err);
    }
  };

  return (
    <div className="new">
      <Sidebar />
      <div className="newContainer">
        <Navbar />
        <div className="datatable">
          <div className="datatableTitle">
            {singleData['title']}
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
                  ? <>
                  {/* <textarea value={singleData[input.id]}
                      id={input.id}
                      type={input.type}
                      placeholder={input.placeholder}
                      onChange={handleInput} /> */}
                        <Editor
      // apiKey='yve9colpyhhyfm26202gyz3avsdug0i7ehcgtphp0idg3yj1'
      // apiKey='2g1rz3p7mu6z3ca6hxmdi30gj79r7xammpk1sewuy8lx1tdt'
      // apiKey='3pqxrkflt9f3n48wkor4ep6rlpfavvza7x549n0piw94yt47'
      // apiKey='lgkqnoa7df7qet2kan7yaabydj9at0y1kdov0a6e7g5g8reh'
      apiKey='ev2weaoflh5hezookdcvk1p4n77jjbrek77hmcsbyl08r58h'
      init={{
        language: 'ru',
        plugins: [
          'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 'image', 'link', 'lists', 'media', 'searchreplace', 'table', 'visualblocks', 'wordcount',
          'checklist', 'mediaembed', 'casechange', 'export', 'formatpainter', 'pageembed', 'a11ychecker', 'tinymcespellchecker', 'permanentpen', 'powerpaste', 'advtable', 'advcode', 'editimage', 'advtemplate', 'ai', 'mentions', 'tinycomments', 'tableofcontents', 'footnotes', 'mergetags', 'autocorrect', 'typography', 'inlinecss', 'markdown',
        ],
        toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
        tinycomments_mode: 'embedded',
        tinycomments_author: 'Author name',
        mergetags_list: [
          { value: 'First.Name', title: 'First Name' },
          { value: 'Email', title: 'Email' },
        ],
        ai_request: (request, respondWith) => respondWith.string(() => Promise.reject('See docs to implement AI Assistant')),
        setup: function(editor) {
          editor.on('change', function(e) {
            handleEditorChange(editor.getContent(), editor);
          });
        },
      }}
      initialValue={singleData[input.id]}
      onChange={handleInput}
      id={input.id}
    />
                      </>
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

              <div className="formInput">
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
              </div>
              <button class="customBtn" disabled={per !== null && per < 100} type="submit">Изменить</button>
            </form>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Single;
