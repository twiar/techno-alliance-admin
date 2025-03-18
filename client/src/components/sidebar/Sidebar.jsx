import "./sidebar.scss";
import StoreIcon from "@mui/icons-material/Store";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.svg";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="top">
        <Link to="/" style={{ textDecoration: "none" }}>
          <img src={logo} className="logo" alt="ТЕХНОАЛЬЯНС" />
        </Link>
      </div>
      <hr />
      <div className="center">
        <ul>
          <Link to="/sections" style={{ textDecoration: "none" }}>
            <li>
              <StoreIcon className="icon" />
              <span>Контент</span>
            </li>
          </Link>
          <li>
            <ExitToAppIcon className="icon" />
            <span>Выйти</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
