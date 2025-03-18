export const userColumns = [
  { field: "id", headerName: "ID", width: 0 },
  {
    field: "image",
    headerName: "Изображение",
    width: 230,
    renderCell: (params) => {
      return (
        <div className="cellWithImg">
          <img className="cellImg" src={params.row.images ? params.row.images[0] : ''} alt="avatar" />
        </div>
      );
    },
  },
  {
    field: "title",
    headerName: "Название",
    width: 770,
  },
];
