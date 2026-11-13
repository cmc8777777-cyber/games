/* Держи Шмыга! · сюжет: комикс-сцены. Тексты — в i18n (ключи st_<сцена>_<кадр>), чтобы шли через переводчика.
   Кадр: фон (картинка Художника story-<сцена>-<n> → иначе фон мира → иначе градиент мира), герои слева/справа, реплика.
   who: кто в кадре (mika, ars, thief, crowd), say: чья реплика (имя над пузырём) или "" для текста автора. */
window.STORY = (function () {
  "use strict";
  var SCENES = {
    intro: { world: "town", frames: [{ who: [], say: "" }, { who: ["thief"], say: "" }, { who: ["mika", "thief"], say: "mika" }] },
    dunes: { world: "dunes", frames: [{ who: ["mika"], say: "" }, { who: ["mika"], say: "mika" }] },
    snow: { world: "snow", frames: [{ who: ["mika", "ars"], say: "" }, { who: ["ars"], say: "ars" }] },
    jungle: { world: "jungle", frames: [{ who: ["mika", "ars"], say: "" }, { who: ["ars", "mika"], say: "mika" }] },
    harbor: { world: "harbor", frames: [{ who: ["thief"], say: "" }, { who: ["mika", "ars"], say: "ars" }] },
    mine: { world: "mine", frames: [{ who: ["thief", "mika"], say: "" }, { who: ["mika", "thief"], say: "thief" }] },
    sky: { world: "sky", frames: [{ who: ["thief"], say: "thief" }, { who: ["mika", "ars"], say: "mika" }] },
    moon: { world: "moon", frames: [{ who: ["mika", "ars"], say: "" }, { who: ["thief"], say: "thief" }] },
    finale: { world: "moon", frames: [{ who: ["mika", "thief"], say: "" }, { who: ["thief"], say: "thief" }, { who: ["mika", "ars"], say: "ars" }, { who: ["crowd"], say: "" }] }
  };
  var ORDER = ["intro", "dunes", "snow", "jungle", "harbor", "mine", "sky", "moon", "finale"];
  return { SCENES: SCENES, ORDER: ORDER };
})();
