let leftTextarea;
let rightTextarea;
let isPerfectON = false;

// WIP tooltip
(() => {
  const message =
    "Please keep in mind this is WIP as there are still some bugs that need to be fixed<br><br>  <b>Known Issues:</b><br>&bull; An empty object/array inside an array break the app<br>&bull; [ ] { } Signs in a string break the app<br>&bull; Some CSS bugs<br><br>Other than that the application should be fully usable";
  $(".WIP").tooltip({ title: message, html: true });
})();

// Initializes textareas
(function () {
  let textareas = [leftTextarea, rightTextarea];
  $("textarea").each(function (index) {
    textareas[index] = CodeMirror.fromTextArea($(this)[0], {
      mode: { name: "javascript", json: true },
      theme: "dracula",
      matchBrackets: true,
      gutters: ["CodeMirror-lint-markers", "CodeMirror-foldgutter"],
      lint: true,
      viewportMargin: Infinity,
      lineNumbers: true,
      extraKeys: {
        F11: function (cm) {
          cm.setOption("fullScreen", !cm.getOption("fullScreen"));
        },
        Esc: function (cm) {
          if (cm.getOption("fullScreen")) cm.setOption("fullScreen", false);
        },
        "Shift-Tab": function (cm) {
          cm.setValue(JSON.stringify(JSON.parse(cm.getValue()), null, 2));
        },
        "Ctrl-Q": function (cm) {
          cm.foldCode(cm.getCursor());
        },
      },
      foldGutter: true,
      foldOptions: {
        widget: (from, to) => {
          let count = undefined;

          // Get open / close token
          let startToken = "{",
            endToken = "}";
          let prevLine = textareas[index].getLine(from.line);
          if (prevLine.lastIndexOf("[") > prevLine.lastIndexOf("{")) {
            (startToken = "["), (endToken = "]");
          }

          // Get json content
          let internal = textareas[index].getRange(from, to);
          let toParse = startToken + internal + endToken;

          // Get key count
          try {
            let parsed = JSON.parse(toParse);
            count = Object.keys(parsed).length;
          } catch (e) {}

          return count ? `\u21A4${count}\u21A6` : "\u2194";
        },
      },
    });

    textareas[index].on("change", function () {
      if (isPerfectON) {
        perfectOFF();
        isPerfectON = false;
      }
    });
  });

  leftTextarea = textareas[0];
  rightTextarea = textareas[1];
})();

function perfectON() {
  $(".CodeMirror").addClass("noDifference");
  isPerfectON = true;
}

function perfectOFF() {
  $(".CodeMirror").removeClass("noDifference");
}

function compareJSONS() {
  // add rules
  let leftObject = JSON.parse(leftTextarea.getValue());
  let rightObject = JSON.parse(rightTextarea.getValue());

  let diff = compareObjects(leftObject, rightObject);
  console.log(diff);
  console.log(getFlatObject(diff));
  let organizedFlatDiffObject = getOrganizedFlatObject(getFlatObject(diff));
  format(leftObject, rightObject);
  console.log(organizedFlatDiffObject);
  if ($.isEmptyObject(organizedFlatDiffObject)) perfectON();
  else color(organizedFlatDiffObject);
}

function format(leftObject, rightObject) {
  [leftTextarea, rightTextarea].forEach((textarea, index) => {
    textarea.setValue(JSON.stringify(arguments[index], null, 2));
    const divColumns = ["left", "right"];
    let path = "";
    let curlyBracketsToClose = [];
    // open brackets by position
    let indexArray = [];
    let increment = false;
    $(`div#${divColumns[index]} div[style="position: relative;"]`).each(
      (index, row) => {
        if (increment && /\.(0|[1-9][0-9]*)$/.test(path)) {
          path = path
            .substring(0, path.lastIndexOf("."))
            .concat(`.${indexArray[indexArray.length - 1]}`);
          indexArray[indexArray.length - 1]++;
        }
        row.setAttribute("path", path);
        let domPropertyName = $(row)
          .find("span.cm-property")
          .text()
          .slice(1, -1);

        if ($(row).find(`:contains([)`).length) {
          indexArray.push(0);
          curlyBracketsToClose.push(0);
          if (domPropertyName)
            path
              ? (path += `.${domPropertyName}.${
                  indexArray[indexArray.length - 1]
                }`)
              : (path = `${domPropertyName}.${
                  indexArray[indexArray.length - 1]
                }`);
          else
            path
              ? (path += `.${indexArray[indexArray.length - 1]}`)
              : (path = `.${indexArray[indexArray.length - 1]}`);
          increment = true;
        } else if ($(row).find(`:contains({)`).length) {
          if (curlyBracketsToClose.length)
            curlyBracketsToClose[curlyBracketsToClose.length - 1]++;
          increment = false;
          if ($(row).find("span.cm-property").length)
            path ? (path += `.${domPropertyName}`) : (path = domPropertyName);
        } else if ($(row).find(`:contains(})`).length && path) {
          if (!/\.(0|[1-9][0-9]*)$/.test(path))
            path
              ? (path = path.substring(0, path.lastIndexOf(".")))
              : (path = "");
          if (curlyBracketsToClose.length)
            curlyBracketsToClose[curlyBracketsToClose.length - 1]--;
        } else if ($(row).find(`:contains(])`).length) {
          let pathArray = path.split(".");
          // If array inside array
          /\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.test(path)
            ? (path = path.substring(0, path.lastIndexOf(".")))
            : (path = pathArray.slice(0, pathArray.length - 2).join("."));
          indexArray.pop();
          curlyBracketsToClose.pop();
        }
        if (curlyBracketsToClose[curlyBracketsToClose.length - 1] == 0)
          increment = true;
      }
    );
  });
}

function color(organizedFlatDiffObject) {
  // both, left, right
  const textareaToColor = ["#left, #right", "#left", "#right"];
  const currentOperation = [
    organizedFlatDiffObject.different,
    organizedFlatDiffObject.extraLeft,
    organizedFlatDiffObject.extraRight,
  ];

  let isExtra = false;
  for (let i = 0; i < 3; i++) {
    $(`${textareaToColor[i]}`).each(function () {
      let textarea = $(this)[0].id;
      currentOperation[i].forEach((currentFlatPath) => {
        let path;
        let leaf;
        let rowToColor;
        if (!/\.(0|[1-9][0-9]*)$/.test(currentFlatPath)) {
          if (currentFlatPath.indexOf(".") === -1) {
            path = "";
            leaf = currentFlatPath;
          } else {
            path = currentFlatPath.substring(
              0,
              currentFlatPath.lastIndexOf(".")
            );
            leaf = currentFlatPath.substring(
              currentFlatPath.lastIndexOf(".") + 1,
              currentFlatPath.length
            );
          }
        } else path = currentFlatPath;

        const exactMatch = $(
          `div#${textarea} div[path="${path}"] span.cm-property`
        ).filter(function () {
          return $(this)[0].innerText === `"${leaf}"`;
        });
        // To prevent coloring wrong fields
        if (exactMatch.length > 1) throw "More than one match";
        else if (exactMatch.length) rowToColor = exactMatch[0];
        else if ($(`div#${textarea} div[path="${path}"] span.cm-string`).length)
          rowToColor = $(`div#${textarea} div[path="${path}"] span.cm-string`);
        else
          rowToColor = $(`div#${textarea} div[path="${path}"] span.cm-number`);

        $(rowToColor).each(function () {
          isExtra
            ? $(this)[0].classList.add("extra")
            : $(this)[0].classList.add("different");
          $(this)[0].setAttribute("data-toggle", "tooltip");
          if (path) addTooltip($(this)[0], path);
        });
      });
    });
    isExtra = true;
  }
}

const addTooltip = (element, path) => {
  $(element).tooltip({
    title: path.replace(/\.(0|[1-9][0-9]*)/g, "[$1]").replace(/\./g, " -> "),
  });
};
