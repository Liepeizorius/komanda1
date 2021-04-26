import axios from "axios";
import React, { useEffect, useState } from "react";
import { Redirect, Link } from "react-router-dom";
import styles from "./AdminPanel.module.css";
import LOGO from "../../assets/images/logo.png";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { GridLoader } from "react-spinners";
import { css } from "@emotion/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

let AdminPanel = () => {
  library.add(fas, far);
  /* redirect to login page if not logged in */
  const [redirect, setRedirect] = useState(null);
  /* keep count of current page used to display data */
  const [page, setPage] = useState(1);
  /* gather all data */
  const [fetchAllData, setFetchAllData] = useState([]);
  /* used to gather all unique states of fetchAllData */
  const [savivaldybes, setSavivaldybes] = useState([]);
  /* used to gather all unique groups of fetchAllData */
  const [grupe, setGrupe] = useState([]);
  /* used to gather all unique types of fetchAllData */
  const [tipas, setTipas] = useState([]);
  const [teisine, setTeisine] = useState([]);
  /* filter object used to decide by which criteria must be displayed */
  const [filtSub, setFiltSub] = useState({});
  /* filtered data */
  const [displayData, setDisplayData] = useState([]);
  /* filtered AND paginated data to cope with big ammounts of information */
  const [paginatedData, setPaginatedData] = useState([]);
  /* Loading spinner state while fetching data */
  const [isLoading, setIsLoading] = useState(true);

  /* post-button data object */
  const [postObj, setPostObj] = useState({
    Pavadinimas: "",
    Telefonas: "",
    Grupė: "",
    Savivaldybė: "",
    "Pagrindinis tipas": "",
    "El. paštas": "",
    "Teisinė forma": "",
  });
  const [postModal, setPostModal] = useState(false);

  useEffect(() => {
    /* check if admin is logged in - redirect if admin doesnt have correct jwt */
    axios
      .get("http://localhost:3001/v1/currentAdmin", {
        headers: {
          "admin-id": localStorage.getItem("admin-id"),
        },
      })
      .then((res) => {})
      .catch((e) => {
        setRedirect("/v1/admin/login");
      });

    axios.get(`http://localhost:3001/v1/getAllData`).then((res) => {
      /* Fetching ALL data also fitering all UNIQUE criteria for filters used in data filtration */
      setSavivaldybes(
        Array.from(new Set(res.data.map((el) => el["Savivaldybė"])))
      );
      setGrupe(Array.from(new Set(res.data.map((el) => el["Grupė"]))));
      setTipas(
        Array.from(new Set(res.data.map((el) => el["Pagrindinis tipas"])))
      );
      setTeisine(
        Array.from(new Set(res.data.map((el) => el["Teisinė forma"])))
      );
      setFetchAllData(res.data);
      setIsLoading(false);
    });

    /* Actively listening for changes(check dependency arr) in filtered data to decide which page to display for the user */
    displayData
      ? setPaginatedData(displayData.slice((page - 1) * 20, page * 20))
      : console.log("asd");
  }, [displayData, page]);

  const pageInputHandler = (e) => {
    /* if the user presses enter and the page is valid: scroll to top and display paginated data for the user */
    if (e.key === "Enter") {
      console.log("paginated page");
      if (
        +e.target.value >= 1 &&
        e.target.value <= Math.ceil(displayData.length / 20)
      ) {
        window.scrollTo(0, 0);
        setPage(+e.target.value);
        return page === e.target.value
          ? setPaginatedData(() => {
              return displayData.slice((page - 1) * 20, page * 20);
            })
          : null;
      }
    }
  };

  const handleFilterSubmit = (e) => {
    /* Handle data filtration and set data arrays for pagination to use the information
            NOTE: DATA GATHERED BY THE FILTER IS USED IN useEffect *****NOT HERE*****, DATA GATHERED HERE IS ONLY TO BE DISPLAYED LATER
        */
    /* Prevent reload on submit and prepping array for DB info(resetting), also setting page to 1 in case it wasn't 1(if page isnt 1 and there is only 1 page there would obviously be nothing to paginate) before */
    e.preventDefault();
    setDisplayData([]);
    if (page !== 1) setPage(1);
    /* Filter for when the user is ONLY searching via keyword */
    if (
      filtSub["Pavadinimas"] &&
      !filtSub["Grupė"] &&
      !filtSub["Pagrindinis tipas"] &&
      !filtSub["Savivaldybė"]
    ) {
      setDisplayData(() => {
        let condition = new RegExp(filtSub["Pavadinimas"].toLowerCase());
        return fetchAllData.filter((el) => {
          return condition.test(el["Pavadinimas"].toLowerCase());
        });
      });
      /* Filter for when the user is searching by both: ALL the select filters AND keyword */
    } else if (
      filtSub["Pavadinimas"] &&
      filtSub["Grupė"] &&
      filtSub["Pagrindinis tipas"] &&
      filtSub["Savivaldybė"]
    ) {
      setDisplayData(() => {
        let condition = new RegExp(filtSub["Pavadinimas"].toLowerCase());
        return fetchAllData
          .filter((el) => {
            return condition.test(el["Pavadinimas"].toLowerCase());
          })
          .filter((el, index, arr) => {
            for (let key in filtSub) {
              if (key === "Pavadinimas") continue;
              if (el[key] !== filtSub[key]) return false;
            }
            return true;
          });
      });
      /* filter for when the user is searching ONLY by select filters */
    } else if (
      (filtSub["Grupė"] ||
        filtSub["Pagrindinis tipas"] ||
        filtSub["Savivaldybė"]) &&
      filtSub["Pavadinimas"]
    ) {
      setDisplayData(() => {
        let condition = new RegExp(filtSub["Pavadinimas"].toLowerCase());
        return fetchAllData
          .filter((el) => {
            return condition.test(el["Pavadinimas"].toLowerCase());
          })
          .filter((el, index, arr) => {
            for (let key in filtSub) {
              if (filtSub[key] === "" || key === "Pavadinimas") continue;
              if (el[key] !== filtSub[key]) {
                return false;
              }
            }
            return true;
          });
      });
      /* Filter for when the user is searching by one or more select filters AND via keyword */
    } else if (
      (filtSub["Grupė"] ||
        filtSub["Pagrindinis tipas"] ||
        filtSub["Savivaldybė"]) &&
      !filtSub["Pavadinimas"]
    ) {
      setDisplayData(() => {
        return fetchAllData.filter((el) => {
          for (let key in filtSub) {
            if (filtSub[key] === "" || key === "Pavadinimas") continue;
            if (el[key] !== filtSub[key]) {
              return false;
            }
          }
          return true;
        });
      });
    }
  };

  const handlePostSubmit = (e) => {
    e.preventDefault();
    console.log(postObj);
    for (let key in postObj) {
      if (!postObj[key]) {
        return false;
      }
    }
    axios
      .post("http://localhost:3001/v1/dataPost", postObj, {
        headers: {
          "Content-Type": "application/json",
          "admin-id": localStorage.getItem("admin-id"),
        },
      })
      .then((data) => {
        setPostModal(false);
      });
  };
  const handlePostModal = (action) => {
    if (action === "close") setPostModal(false);
    if (action === "open") setPostModal(true);
  };

  const logoutHandler = () => {
    axios
      .get("http://localhost:3001/v1/admin/logout", {
        headers: {
          "admin-id": localStorage.getItem("admin-id"),
        },
      })
      .then((data) => {
        localStorage.removeItem("admin-id");
        setRedirect("/v1/admin/login");
      });
  };
  /* Redirect if admin login jwt in local storage doesn't match the jwts in MongoDB, value of redirect which used in the if statement is determined inside useEffect (route: http://localhost:3001/v1/currentAdmin) */
  if (redirect) {
    return <Redirect to={redirect} />;
  }

  return (
    <>
      <header className={styles.header}>
        <ul className={styles.ul}>
          <li>
            <Link to={"/v1"}>
              <img src={LOGO} alt="logo" className={styles.img}></img>
            </Link>
          </li>
          <li>
            <button className={styles["header-btn"]} onClick={logoutHandler}>
              Logout
            </button>
          </li>
          <li>
            <button className={styles["header-btn"]}>
              <FontAwesomeIcon
                className={styles["fontawesome-icon"]}
                icon={["fas", "cog"]}
                size="2x"
              />
            </button>
          </li>
        </ul>
      </header>
      {isLoading ? (
        <div className={styles.loader}>
          <GridLoader css={override} size={50} color={"#3a90ed"} />
          <p>Gaunamos įstaigos...</p>
        </div>
      ) : (
        <main className={styles.main}>
          {postModal ? (
            <div className={styles["post-modal"]}>
              <div className={styles["modal-container-background"]}></div>
              <div className={styles["modal-container"]}>
                <div
                  className={styles["post-quit"]}
                  onClick={() => handlePostModal("close")}
                >
                  <FontAwesomeIcon
                    className={styles["fontawesome-close"]}
                    icon={["far", "times-circle"]}
                    size="2x"
                  />
                </div>
                <form className={styles["post-button-form"]}>
                  <div className={styles["form-control"]}>
                    <label
                      className={styles["form-label"]}
                      htmlFor="post-savivaldybe"
                    >
                      Savivaldybe
                    </label>
                    <input
                      className={styles["form-input"]}
                      type="text"
                      list="post-sav"
                      onChange={(e) =>
                        setPostObj({ ...postObj, Savivaldybė: e.target.value })
                      }
                    />
                    <datalist id="post-sav">
                      {savivaldybes
                        ? savivaldybes.map((item, key) => {
                            return <option key={key} value={item} />;
                          })
                        : null}
                    </datalist>
                  </div>
                  <div className={styles["form-control"]}>
                    <label
                      className={styles["form-label"]}
                      htmlFor="post-grupe"
                    >
                      Grupė
                    </label>
                    <input
                      className={styles["form-input"]}
                      type="text"
                      list="post-gr"
                      onChange={(e) =>
                        setPostObj({ ...postObj, Grupė: e.target.value })
                      }
                    />
                    <datalist id="post-gr">
                      {grupe
                        ? grupe.map((item, key) => {
                            return <option key={key} value={item} />;
                          })
                        : null}
                    </datalist>
                  </div>
                  <div className={styles["form-control"]}>
                    <label
                      className={styles["form-label"]}
                      htmlFor="post-pagr-tipas"
                    >
                      Pagrindinis tipas
                    </label>
                    <input
                      className={styles["form-input"]}
                      type="text"
                      list="post-pgr"
                      onChange={(e) =>
                        setPostObj({
                          ...postObj,
                          "Pagrindinis tipas": e.target.value,
                        })
                      }
                    />
                    <datalist id="post-pgr">
                      {tipas
                        ? tipas.map((item, key) => {
                            return <option key={key} value={item} />;
                          })
                        : null}
                    </datalist>
                  </div>
                  <div className={styles["form-control"]}>
                    <label
                      className={styles["form-label"]}
                      htmlFor="post-pavadinimas"
                    >
                      Pavadinimas
                    </label>
                    <input
                      className={styles["form-input"]}
                      type="text"
                      onChange={(e) =>
                        setPostObj({ ...postObj, Pavadinimas: e.target.value })
                      }
                    />
                  </div>
                  <div className={styles["form-control"]}>
                    <label
                      className={styles["form-label"]}
                      htmlFor="post-Telefonas"
                    >
                      Telefonas
                    </label>
                    <input
                      className={styles["form-input"]}
                      type="text"
                      onChange={(e) =>
                        setPostObj({ ...postObj, Telefonas: e.target.value })
                      }
                    />
                  </div>
                  <div className={styles["form-control"]}>
                    <label
                      className={styles["form-label"]}
                      htmlFor="post-El. paštas"
                    >
                      El. paštas
                    </label>
                    <input
                      className={styles["form-input"]}
                      type="text"
                      onChange={(e) =>
                        setPostObj({ ...postObj, "El. paštas": e.target.value })
                      }
                    />
                  </div>
                  <div className={styles["form-control"]}>
                    <label
                      className={styles["form-label"]}
                      htmlFor="post-teisine-forma"
                    >
                      Teisinė forma
                    </label>
                    <input
                      className={styles["form-input"]}
                      type="text"
                      list="post-tf"
                      onChange={(e) =>
                        setPostObj({
                          ...postObj,
                          "Teisinė forma": e.target.value,
                        })
                      }
                    />
                    <datalist id="post-tf">
                      {teisine
                        ? teisine.map((item, key) => {
                            return <option key={key} value={item} />;
                          })
                        : null}
                    </datalist>
                  </div>
                  <div className={styles["form-control"]}>
                    <input
                      className={styles["post-submit"]}
                      type="submit"
                      value="Pateikti"
                      onClick={handlePostSubmit}
                    />
                  </div>
                </form>
              </div>
            </div>
          ) : null}
          <div className={styles["changePasswordModal"]}></div>
          <div className={styles["filter-form-wrapper"]}>
            <form className={styles["filter-form"]}>
              <div className={styles["form-control"]}>
                <label className={styles["form-label"]} htmlFor="savivaldybe">
                  Savivaldybe
                </label>
                <input
                  className={styles["form-input"]}
                  type="text"
                  list="data-sav"
                  onChange={(e) =>
                    setFiltSub({ ...filtSub, Savivaldybė: e.target.value })
                  }
                />
                <datalist id="data-sav">
                  {savivaldybes
                    ? savivaldybes.map((item, key) => {
                        return <option key={key} value={item} />;
                      })
                    : null}
                </datalist>
              </div>
              <div className={styles["form-control"]}>
                <label className={styles["form-label"]} htmlFor="pavadinimas">
                  Pavadinimas
                </label>
                <input
                  className={styles["form-input"]}
                  type="text"
                  onChange={(e) =>
                    setFiltSub({ ...filtSub, Pavadinimas: e.target.value })
                  }
                />
              </div>
              <div className={styles["form-control"]}>
                <label className={styles["form-label"]} htmlFor="grupe">
                  Grupe
                </label>
                <input
                  className={styles["form-input"]}
                  type="text"
                  list="data-gr"
                  onChange={(e) =>
                    setFiltSub({ ...filtSub, Grupė: e.target.value })
                  }
                />
                <datalist id="data-gr">
                  {grupe
                    ? grupe.map((item, key) => {
                        return <option key={key} value={item} />;
                      })
                    : null}
                </datalist>
              </div>
              <div className={styles["form-control"]}>
                <label className={styles["form-label"]} htmlFor="tipas">
                  Tipas
                </label>
                <input
                  className={styles["form-input"]}
                  type="text"
                  list="data-tipas"
                  onChange={(e) =>
                    setFiltSub({
                      ...filtSub,
                      "Pagrindinis tipas": e.target.value,
                    })
                  }
                />
                <datalist id="data-tipas">
                  {tipas
                    ? tipas.map((item, key) => {
                        return <option key={key} value={item} />;
                      })
                    : null}
                </datalist>
              </div>
              <div className={styles["filter-container"]}>
                <input
                  className={styles["filter-submit"]}
                  type="reset"
                  value="Filtruoti"
                  onClick={handleFilterSubmit}
                />
              </div>
            </form>
          </div>
          <div className={styles.wrapper}>
            <div
              className={styles["add-post"]}
              onClick={() => handlePostModal("open")}
            >
              <div className={styles["fontawesome-wrapper"]}>
                <FontAwesomeIcon
                  className={styles["fontawesome-plus"]}
                  icon={["fas", "plus"]}
                  size="2x"
                />
              </div>
            </div>
            <div className={styles["output-list"]}>
              {/* DYNAMIC DATA IS DISPLAYED TO THE USER HERE */}
              {paginatedData.map((el) => {
                return (
                  <div key={el._id} className={styles["output-item"]}>
                    {Object.entries(el).map(([key, value]) => {
                      return (
                        <div className={styles["output-pair"]}>
                          <h4 className={styles.h4}>{key}: </h4>
                          <h5 className={styles.h5}> {value}</h5>
                        </div>
                      );
                    })}
                    <div className={styles["button-div"]}>
                      <button className={`${styles.button} ${styles.delete}`}>
                        Ištrinti
                      </button>
                      <button className={`${styles.button} ${styles.update}`}>
                        Atnaujinti
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className={styles.pagination}>
              <div className={styles["input-pagination"]}>
                <input
                  className={styles["input-txt"]}
                  type="number"
                  placeholder={page}
                  onKeyDown={pageInputHandler}
                />
                <h5 className={styles.pageCount}>
                  /{Math.ceil(displayData.length / 20)}
                </h5>
              </div>
            </div>
          </div>
        </main>
      )}
      <footer></footer>
    </>
  );
};

const override = css`
  display: block;
  margin: 0 auto;
`;

export default AdminPanel;
