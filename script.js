const TWO_PI = Math.PI * 2;
const HALF_PI = Math.PI * 0.5;

// canvas settings
var viewWidth = 512,
  viewHeight = 350,
  drawingCanvas = document.getElementById("drawing_canvas"),
  ctx,
  timeStep = 1 / 60;

Point = function (x, y) {
  this.x = x || 0;
  this.y = y || 0;
};

Particle = function (p0, p1, p2, p3) {
  this.p0 = p0;
  this.p1 = p1;
  this.p2 = p2;
  this.p3 = p3;

  this.time = 0;
  this.duration = 3 + Math.random() * 2;
  this.color = "#" + Math.floor(Math.random() * 0xffffff).toString(16);

  this.w = 8;
  this.h = 6;

  this.complete = false;
};

Particle.prototype = {
  update: function () {
    this.time = Math.min(this.duration, this.time + timeStep);

    var f = Ease.outCubic(this.time, 0, 1, this.duration);
    var p = cubeBezier(this.p0, this.p1, this.p2, this.p3, f);

    var dx = p.x - this.x;
    var dy = p.y - this.y;

    this.r = Math.atan2(dy, dx) + HALF_PI;
    this.sy = Math.sin(Math.PI * f * 10);
    this.x = p.x;
    this.y = p.y;

    this.complete = this.time === this.duration;
  },
  draw: function () {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.r);
    ctx.scale(1, this.sy);

    ctx.fillStyle = this.color;
    ctx.fillRect(-this.w * 0.5, -this.h * 0.5, this.w, this.h);

    ctx.restore();
  },
};

Loader = function (x, y) {
  this.x = x;
  this.y = y;

  this.r = 24;
  this._progress = 0;

  this.complete = false;
};

Loader.prototype = {
  reset: function () {
    this._progress = 0;
    this.complete = false;
  },
  set progress(p) {
    this._progress = p < 0 ? 0 : p > 1 ? 1 : p;

    this.complete = this._progress === 1;
  },
  get progress() {
    return this._progress;
  },
  draw: function () {
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(
      this.x,
      this.y,
      this.r,
      -HALF_PI,
      TWO_PI * this._progress - HALF_PI
    );
    ctx.lineTo(this.x, this.y);
    ctx.closePath();
    ctx.fill();
  },
};

// pun intended
Exploader = function (x, y) {
  this.x = x;
  this.y = y;

  this.startRadius = 24;

  this.time = 0;
  this.duration = 0.4;
  this.progress = 0;

  this.complete = false;
};

Exploader.prototype = {
  reset: function () {
    this.time = 0;
    this.progress = 0;
    this.complete = false;
  },
  update: function () {
    this.time = Math.min(this.duration, this.time + timeStep);
    this.progress = Ease.inBack(this.time, 0, 1, this.duration);

    this.complete = this.time === this.duration;
  },
  draw: function () {
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.startRadius * (1 - this.progress), 0, TWO_PI);
    ctx.fill();
  },
};

var particles = [],
  loader,
  exploader,
  phase = 0;

function initDrawingCanvas() {
  drawingCanvas.width = viewWidth;
  drawingCanvas.height = viewHeight;
  ctx = drawingCanvas.getContext("2d");

  createLoader();
  createExploader();
  createParticles();
}

function createLoader() {
  loader = new Loader(viewWidth * 0.5, viewHeight * 0.5);
}

function createExploader() {
  exploader = new Exploader(viewWidth * 0.5, viewHeight * 0.5);
}

function createParticles() {
  for (var i = 0; i < 128; i++) {
    var p0 = new Point(viewWidth * 0.5, viewHeight * 0.5);
    var p1 = new Point(Math.random() * viewWidth, Math.random() * viewHeight);
    var p2 = new Point(Math.random() * viewWidth, Math.random() * viewHeight);
    var p3 = new Point(Math.random() * viewWidth, viewHeight + 64);

    particles.push(new Particle(p0, p1, p2, p3));
  }
}

function update() {
  switch (phase) {
    case 0:
      loader.progress += 1 / 45;
      break;
    case 1:
      exploader.update();
      break;
    case 2:
      particles.forEach(function (p) {
        p.update();
      });
      break;
  }
}

function draw() {
  ctx.clearRect(0, 0, viewWidth, viewHeight);

  switch (phase) {
    case 0:
      loader.draw();
      break;
    case 1:
      exploader.draw();
      break;
    case 2:
      particles.forEach(function (p) {
        p.draw();
      });
      break;
  }
}

window.onload = function () {
  initDrawingCanvas();
  requestAnimationFrame(loop);
};

function loop() {
  update();
  draw();

  if (phase === 0 && loader.complete) {
    phase = 1;
  } else if (phase === 1 && exploader.complete) {
    phase = 2;
  } else if (phase === 2) {
    if (checkParticlesComplete()) {
      // reset
      phase = 0;
      loader.reset();
      exploader.reset();
      particles.length = 0;
      createParticles();

      // stop the animation loop
      return;
    }
  }

  requestAnimationFrame(loop);
}

function checkParticlesComplete() {
  for (var i = 0; i < particles.length; i++) {
    if (particles[i].complete === false) return false;
  }
  return true;
}

// math and stuff

/**
 * easing equations from http://gizma.com/easing/
 * t = current time
 * b = start value
 * c = delta value
 * d = duration
 */
var Ease = {
  inCubic: function (t, b, c, d) {
    t /= d;
    return c * t * t * t + b;
  },
  outCubic: function (t, b, c, d) {
    t /= d;
    t--;
    return c * (t * t * t + 1) + b;
  },
  inOutCubic: function (t, b, c, d) {
    t /= d / 2;
    if (t < 1) return (c / 2) * t * t * t + b;
    t -= 2;
    return (c / 2) * (t * t * t + 2) + b;
  },
  inBack: function (t, b, c, d, s) {
    s = s || 1.70158;
    return c * (t /= d) * t * ((s + 1) * t - s) + b;
  },
};

function cubeBezier(p0, c0, c1, p1, t) {
  var p = new Point();
  var nt = 1 - t;

  p.x =
    nt * nt * nt * p0.x +
    3 * nt * nt * t * c0.x +
    3 * nt * t * t * c1.x +
    t * t * t * p1.x;
  p.y =
    nt * nt * nt * p0.y +
    3 * nt * nt * t * c0.y +
    3 * nt * t * t * c1.y +
    t * t * t * p1.y;

  return p;
}

var slides = document.querySelectorAll(".slide");
var dots = document.querySelectorAll(".dot");
var index = 0;

function prevSlide(n) {
  index += n;
  console.log("prevSlide is called");
  changeSlide();
}

function nextSlide(n) {
  index += n;
  changeSlide();
}

changeSlide();

function changeSlide() {
  if (index > slides.length - 1) index = 0;

  if (index < 0) index = slides.length - 1;

  for (let i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";

    dots[i].classList.remove("active");
  }

  slides[index].style.display = "block";
  dots[index].classList.add("active");
}

// quiz aimnation
let isAnimationAllowed = true;

document.getElementById("quizbtntap").addEventListener("click", function() {
  document.getElementById("formtap").style.display = "block";
  document.getElementById("requiz").style.display = "none";
  isAnimationAllowed = false; // Set the flag to false when the first function is executed
});

const spans = document.querySelectorAll(".word span");

function animateSpan(span, idx) {
  if (!isAnimationAllowed) { // Check if animation is allowed before executing
    return;
  }

  span.addEventListener("click", (e) => {
    e.target.classList.add("active");
  });
  span.addEventListener("animationend", (e) => {
    e.target.classList.remove("active");
  });

  // Initial animation
  setTimeout(() => {
    span.classList.add("active");
  }, 750 * (idx + 1));
}

spans.forEach((span, idx) => {
  animateSpan(span, idx);

  // Add interval to repeatedly animate the span
  setInterval(() => {
    animateSpan(span, idx);
  }, 3000); // Set the delay to your desired interval
});

// button

var resbtn = document.getElementById("resbtn");
var resbtnText = document.getElementById("resbtnText");

resbtn.onclick = function () {
  resbtnText.innerHTML = "Cleared";
  resbtn.classList.add("active");

  // Reset the button after a short delay
  setTimeout(function () {
    resbtnText.innerHTML = "RESET";
    resbtn.classList.remove("active");
  }, 2000); // 2000ms = 2 seconds
};





let output = {};

const subBtn = document.getElementById("subbtn");
const resBtn = document.getElementById("resbtn");
const checkboxes = document.getElementsByTagName("input");

subBtn.addEventListener("click", () => {
  console.log("Clicked");

  const traitsCount = {
    Realistic: 0,
    Investigation: 0,
    Artistic: 0,
    Social: 0,
    Enterprising: 0,
    Conventional: 0,
  };

  const checkboxesMapping = {
    Realistic: [1, 10, 17, 22, 30, 32, 37],
    Investigation: [2, 11, 18, 21, 26, 33, 39],
    Artistic: [3, 8, 17, 23, 27, 31, 41],
    Social: [4, 12, 13, 20, 28, 34, 40],
    Enterprising: [5, 10, 16, 19, 24, 36, 42],
    Conventional: [6, 9, 15, 24, 25, 35, 38],
  };

  for (let trait in traitsCount) {
    checkboxesMapping[trait].forEach((index) => {
      const checkbox = document.getElementById(`checkBox${index}`);
      if (checkbox.checked) {
        traitsCount[trait]++;
        console.log(trait[0]);
      }
    });
  }

  let generalization = "";
  let courses = "";

  if (
    traitsCount.Realistic == 0 &&
    traitsCount.Investigation == 0 &&
    traitsCount.Artistic == 0 &&
    traitsCount.Social == 0 &&
    traitsCount.Enterprising == 0 &&
    traitsCount.Conventional == 0
  ) {
    alert("Please Select at least one option");
    return;
  }

  if (
    traitsCount.Realistic >= traitsCount.Investigation &&
    traitsCount.Realistic >= traitsCount.Artistic &&
    traitsCount.Realistic >= traitsCount.Social &&
    traitsCount.Realistic >= traitsCount.Enterprising &&
    traitsCount.Realistic >= traitsCount.Conventional
  ) {
    generalization =
      " Generalization: You are often good at mechanical or athletic jobs Good Career options for you: \nComputers\nEngineering\nAgriculture\nNatural Resources";
    courses = "Course: BCA\nBBA";
  } else if (
    traitsCount.Investigation >= traitsCount.Artistic &&
    traitsCount.Investigation >= traitsCount.Social &&
    traitsCount.Investigation >= traitsCount.Enterprising &&
    traitsCount.Investigation >= traitsCount.Conventional
  ) {
    generalization =
      "Generalization: You like to watch, learn, analyse & solve problems Good Career options for you:\nEconomics\nBusiness\nPsychology\nMarine";
    courses = "Course: BCOM\nBBA";
  } else if (
    traitsCount.Artistic >= traitsCount.Social &&
    traitsCount.Artistic >= traitsCount.Enterprising &&
    traitsCount.Artistic >= traitsCount.Conventional
  ) {
    generalization =
      "Generalization: You like to work in unstructured situations where you can ran use use vour your creativity Good Career options for you:\nFine & Performing Arts\nInterior Design\nArchiteture\nPublic & Human Services\nAnimation and Graphics";
    courses = "Course: BCA";
  } else if (
    traitsCount.Social >= traitsCount.Enterprising &&
    traitsCount.Social >= traitsCount.Conventional
  ) {
    generalization =
      "Generalization: You like to work with other people, rather than things Good Career`Options for you:\nTravel\nCounseling\nAdvertising\nPublic Relations\nEducation";
    courses = "Course: BTTM\nBBA";
  } else if (traitsCount.Enterprising >= traitsCount.Conventional) {
    generalization =
      "Generalization: You like to work with others & enjoy persuading and performing Good Career options for you:\nMarketing/ Sales\nLaw\nBanking/Finance\nTourism";
    courses = "Course: BTTM\nBBA\nBCOM";
  } else {
    generalization =
      "Generalization: You are very detail oriented, organised & like to work with data.Good Career options for you:\nAccounting\nInsurance\nBanking\nAdministration\nData Processing";
    courses = "Course: BCA\nBBA\nBCOM";
  }

  output = { generalization, courses };
  showPopup(output);
});

resBtn.addEventListener("click", () => {
  output = {};
  document.getElementById("generalization").innerHTML = "";
  document.getElementById("courses").innerHTML = "";

  for (let i = 0; i < checkboxes.length; i++) {
    if (checkboxes[i].type === "checkbox") {
      checkboxes[i].checked = false;
    }
  }
});

function showPopup(output) {
  const popupContainer = document.getElementById("popup-container");
  const generalization = document.getElementById("generalization");
  const courses = document.getElementById("courses");

  generalization.innerText = output.generalization;
  courses.innerText = output.courses;

  popupContainer.style.visibility = "visible";
}

document.getElementById("subbtn").addEventListener("click", () => {
  const checkBoxes = document.querySelectorAll("input[type='checkbox']");
  let isAnyCheckboxChecked = false;

  for (const checkBox of checkBoxes) {
    if (checkBox.checked) {
      isAnyCheckboxChecked = true;
      break;
    }
  }

  if (isAnyCheckboxChecked) {
    // Your existing code for handling the submit button click event
    showPopup(output);
  }
});

const closeButton = document.querySelector(".close-button");
closeButton.addEventListener("click", () => {
  const popupContainer = document.getElementById("popup-container");
  popupContainer.style.visibility = "hidden";
});



// quiz btn
// document.getElementById("quizbtntap").addEventListener("click", function() {
//   document.getElementById("formtap").style.display = "block";
//   document.getElementById("requiz").style.display = "none";
// });


