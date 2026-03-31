import React from "react";
import { useTranslation } from "react-i18next";
import "./i18n";

function About() {
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
        <div id="Need_help_with_your_kid">
          <span>{t("we-are")}</span>
        </div>
        <div id="Babysitter">
          <span>{t("aboutus")}</span>
        </div>
      </div>
    </div>
  );
}

export default About;
