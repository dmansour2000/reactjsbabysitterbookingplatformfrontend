import React from "react";
import { useTranslation } from "react-i18next";
import "./i18n";

function Home() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <div id="Design">
        <div id="Icons">
          <img
            id="Vector_Smart_Object_Doble_Clic_l"
            src="imgs/Vector_Smart_Object_Doble_Clic_l.png"
          ></img>
        </div>
      </div>
      <div id="Image">
        <img id="Your_Image_Here" src="imgs/Your_Image_Here.png"></img>

        <img id="Layer_1" src="imgs/Layer_1.png"></img>
      </div>
      <div id="Text">
        <div id="Lorem_ipsum_dolor_sit_amet_con">
          <span>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            labore et dolore magna aliqua.
          </span>
          <span> Quis ipsum suspendisse ultrices </span>
          <span>
            gravida. Ritsu commodo viverra maecenas accumsan lacus vel
            facilisis.{" "}
          </span>
        </div>
        <div id="Need_help_with_your_kid">
          <span>{t("need-help")}</span>
        </div>
        <div id="Babysitter">
          <span>{t("babysitter")}</span>
        </div>
      </div>
    </div>
  );
}

export default Home;
