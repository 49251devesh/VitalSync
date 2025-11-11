import styles from "../components/HomePage.module.css";
import { useNavigate } from "react-router-dom";
const HomePage = () => {
    const navigate = useNavigate(); 
  return (
    <>
      <header className={styles.header} onClick={() => console.log("clicked")}>
        <div className={styles.leftSection}>
          <img src="../public/logo.png" alt="logo" className={styles.logo} />
          <p className={styles.top}>VitalSync</p>
        </div>

        <nav className={styles.navbar}>
          <ul>
            <li><a href="#">Home</a></li>
            <li><a href="#">Success</a></li>
            <li><a href="#">About Us</a></li>
          </ul>
        </nav>
      </header>
      <hr className={styles.hr1}></hr>
      <main className={styles.container}>
            <div className={styles.left}>
              <div className={styles.h44}>
                <h2 className={styles.quote}>Your wellbeing is our purpose <br>
                </br>and your recovery <br/>our pride</h2>
                <img src="../public/cover.gif" alt="ntg" className={styles.gif}/>
                </div>
                <div className={styles.buttons}>
                    <button className={styles.patient} onClick={()=>navigate("/patient-login")}>Patient</button>
                    <button className={styles.doctor} onClick={()=>navigate("/hospital")}>Doctor</button>
                    <button className={styles.sos} onClick={()=>navigate("/sos")}>SOS</button>
                    <button className={styles.scan} onClick={()=>navigate("/scan")}>Scan</button>
                </div>
            </div>
            <div className={styles.right}>
                <img src="../public/mainpage.jpg" alt="mainpic" className={styles.pic}/>
            </div>
      </main>
    </>
  );
};

export default HomePage;
