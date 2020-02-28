function getOrganizedObject(obj) {
  let flatObj = getFlatObject(obj);
  let keysArray = Object.keys(flatObj);
  let slicedArray = keysArray.map((item) => item.split("."));
  slicedArray.forEach((item) => (item.length = findStartingIndex(item) + 1));
  return slicedArray;
}

function getUniqueDifference(diff) {
  let organized = getOrganizedObject(diff);
  organized.forEach((item) => (item.length = findStartingIndex(item)));
  return Array.from(new Set(organized.map(JSON.stringify)), JSON.parse);
}

function getOrganizedDifference(diff) {
  let obj = getOrganizedObject(diff);

  let difference = {};
  difference.extraLeft = [];
  difference.extraRight = [];
  difference.different = [];

  for (let i = 0; i < obj.length; i++) {
    let textarea1 = obj[i].pop();
    // if obj[i] is the last element
    if (!obj[i + 1]) {
      textarea1 === "leftTextarea"
        ? difference.extraLeft.push(obj[i])
        : difference.extraRight.push(obj[i]);
      break;
    }

    let textarea2 = obj[i + 1].pop();
    if (obj[i].toString() === obj[i + 1].toString()) {
      difference.different.push(obj[i]);
      i++;
      continue;
    } else if (textarea1 === "leftTextarea") difference.extraLeft.push(obj[i]);
    else difference.extraRight.push(obj[i]);
    obj[i + 1].push(textarea2);
  }
  return difference;
}

function findStartingIndex(obj) {
  let left = obj.indexOf("leftTextarea");
  let right = obj.indexOf("rightTextarea");
  return left !== -1 ? left : right;
}

/**
 * @param flatDiff Flat object
 **/
function getOrganizedFlatObject(flatDiff) {
  // Removes everything after "leftTextarea" or "rightTextarea"
  function getFlatObjectWithoutExtra(flatKeys) {
    let leftTextareaLength = ".leftTextarea".length;
    let rightTextareaLength = ".rightTextarea".length;
    flatKeys.forEach((element, i) =>
      element.indexOf(".leftTextarea") !== -1
        ? (flatKeys[i] = element.substring(
            0,
            element.lastIndexOf(".leftTextarea") + leftTextareaLength
          ))
        : (flatKeys[i] = element.substring(
            0,
            element.lastIndexOf(".rightTextarea") + rightTextareaLength
          ))
    );
    return flatKeys;
  }

  let difference = {};
  difference.different = [];
  difference.extraLeft = [];
  difference.extraRight = [];

  const checkIsArray = /\.(0|[1-9][0-9]*)($|\..+)/;
  const leftRel = ".leftTextarea";
  const rightRel = ".rightTextarea";

  let flatKeys = Object.keys(flatDiff);
  // let cleanObject = getFlatObjectWithoutExtra(
  //   JSON.parse(JSON.stringify(flatKeys))
  // );

  for (let i = 0; i < flatKeys.length; i++) {
    //
    //bring out cuurent,next and stuff
    //
    if (!checkIsArray.test(flatKeys[i])) {
      let current = flatKeys[i];
      let next = flatKeys[i + 1];
      // let path;
      let currentTextarea;
      let currentWithoutTextarea;
      if (current.includes(leftRel)) {
        currentTextarea = leftRel;
        currentWithoutTextarea = current.replace(leftRel, "");
        // path = current.substring(0, current.indexOf(leftRel));
      } else {
        currentTextarea = rightRel;
        currentWithoutTextarea = current.replace(rightRel, "");
        //  path = current.substring(0, current.indexOf(rightRel));
      }
      if (!next) {
        currentTextarea === leftRel
          ? difference.extraLeft.push(currentWithoutTextarea)
          : difference.extraRight.push(currentWithoutTextarea);
        break;
      }

      let nextWithoutTextarea;
      next.includes(leftRel)
        ? (nextWithoutTextarea = next.replace(leftRel, ""))
        : (nextWithoutTextarea = next.replace(rightRel, ""));

      if (currentWithoutTextarea === nextWithoutTextarea) {
        difference.different.push(currentWithoutTextarea);
        i++;
      } else
        currentTextarea === leftRel
          ? difference.extraLeft.push(currentWithoutTextarea)
          : difference.extraRight.push(currentWithoutTextarea);

      // let current = cleanObject[i];
      // let next = cleanObject[i + 1];
      // let currentTextarea = current.substring(
      //   current.lastIndexOf("."),
      //   current.length
      // );
      // let currentWithoutTextarea = current.substring(
      //   0,
      //   current.lastIndexOf(".")
      // );
      // // if current is the last element
      // if (!next) {
      //   currentTextarea === leftRel
      //     ? difference.extraLeft.push(currentWithoutTextarea)
      //     : difference.extraRight.push(currentWithoutTextarea);
      //   break;
      // }

      // let nextWithoutTextarea = next.substring(0, next.lastIndexOf("."));
      // if (currentWithoutTextarea === nextWithoutTextarea) {
      //   difference.different.push(currentWithoutTextarea);
      //   i++;
      // } else
      //   currentTextarea === leftRel
      //     ? difference.extraLeft.push(currentWithoutTextarea)
      //     : difference.extraRight.push(currentWithoutTextarea);

      //if current element is an array
    } else {
      let currentFlatArray = flatKeys[i];
      let nextFlatArray = flatKeys[i + 1];
      let currentWithoutTextarea;
      let currentTextarea;
      if (currentFlatArray.includes(leftRel)) {
        currentTextarea = leftRel;
        currentWithoutTextarea = currentFlatArray.replace(leftRel, "");
      } else {
        currentTextarea = rightRel;
        currentWithoutTextarea = currentFlatArray.replace(rightRel, "");
      }
      // if currentFlatArray is the last
      if (!nextFlatArray) {
        currentTextarea === leftRel
          ? difference.extraLeft.push(currentWithoutTextarea)
          : difference.extraRight.push(currentWithoutTextarea);
        break;
      }

      let nextWithoutTextarea;
      let nextTextarea;
      if (nextFlatArray.includes(leftRel)) {
        nextTextarea = leftRel;
        nextWithoutTextarea = nextFlatArray.replace(leftRel, "");
      } else {
        nextTextarea = rightRel;
        nextWithoutTextarea = nextFlatArray.replace(rightRel, "");
      }
      if (currentWithoutTextarea === nextWithoutTextarea) {
        difference.different.push(currentWithoutTextarea);
        i++;
      } else
        currentTextarea === leftRel
          ? difference.extraLeft.push(currentWithoutTextarea)
          : difference.extraRight.push(currentWithoutTextarea);
    }
  }
  if (
    !difference.extraLeft.length &&
    !difference.extraRight.length &&
    !difference.different.length
  )
    return {};
  return difference;
}
