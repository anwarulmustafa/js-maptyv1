"use strict";

//access workout container
const containerWorkouts = document.querySelector(".workouts");
//Access form class
const form = document.querySelector(".form");

//form input fields
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElev = document.querySelector(".form__input--elevation");
////////////////////////////////////////////////
////////////////////workout class //////////////
class Workout {
  date = new Date();
  id = (Date.now() + " ").slice(-10);
  click = 0;
  //
  constructor(coords, distance, duration) {
    this.coords = coords; //it's an array for Lat & Lng
    this.distance = distance;
    this.duration = duration;
  }
  _workoutDescription() {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    this.description = `
  ${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()} 
  `;
  }
  clicks() {
    this.click++;
  }
}

class Running extends Workout {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._workoutDescription();
  }
  calcPace() {
    this.pace = this.distance / this.duration;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = "cycling";
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._workoutDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run1 = new Running([39, -12], 5, 45, 176);
// const Cycl1 = new Cycling([39, -12], 15, 30, 536);
// console.log(run1, Cycl1);
////////////////////////////////////////////
//Application Architect
class app {
  #mapZoomLevel = 13;
  #eventMap;
  #mymap;
  #workouts = [];
  constructor() {
    //get your current locatoin
    this._getPosition();
    //get local storage data
    this._getLocalStorage();

    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleForm);
    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
  }

  _newWorkout(e) {
    //validation
    const validNumber = (...args) => args.every((arg) => Number.isFinite(arg));
    const allPositive = (...args) => args.every((arg) => arg > 0);

    //
    e.preventDefault();
    //get data from the
    let workout;
    let type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#eventMap.latlng;

    // validate data
    if (type === "running") {
      const cadence = +inputCadence.value;
      if (
        !validNumber(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert("A valid positive number is expected!");
      //get the coordiates and open a form
      //
      workout = new Running([lat, lng], distance, duration, cadence);

      //
    }

    //Cycling

    if (type === "cycling") {
      const elevation = +inputElev.value;
      console.log(distance, duration, elevation);
      if (
        !validNumber(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert("A valid positive number is expected!");
      //Cycling object workout
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    this.#workouts.push(workout);
    //console.log(this.#workouts);
    //
    this._renderMarker(workout);

    //render workout in the list
    this._renderWorkout(workout);
    this._setToLocalStorage();
    this._clearInput();
    this._hideForm();
  }
  //
  _toggleForm() {
    inputElev.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  //get current geolocatoin
  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Could not get your current position");
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    //console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
    const coords = [latitude, longitude];
    // console.log(coords);
    // const coordsJed dah = [21.488498046, 39.187332584];
    // const coordsUniv = [21.472900953610626, 39.247073867366595];
    this.#mymap = L.map("map").setView(coords, this.#mapZoomLevel);
    L.tileLayer(
      "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}",
      {
        attribution:
          'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: "mapbox/streets-v11",
        tileSize: 512,
        zoomOffset: -1,
        accessToken:
          "pk.eyJ1IjoiYW53YXJ1bG11c3RhZmEiLCJhIjoiY2tycGdldHhyMmZucjJ3cHZzbDFjdHppdCJ9.c-y4hvlUBVzNetmnm7nzpA",
      }
    ).addTo(this.#mymap);
    this.#mymap.on("click", this._showForm.bind(this));
    //render markers on the map at the time of load.
    this.#workouts.forEach((work) => {
      this._renderMarker(work);
    });
  }
  //
  _showForm(eMap) {
    this.#eventMap = eMap;
    //console.log(this.#eventMap);
    form.classList.remove("hidden");
    inputDistance.focus();
  }
  // hide form
  _hideForm() {
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }
  _clearInput() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElev.value =
        "";
  }
  _renderWorkout(workout) {
    let html = `
            <li class="workout workout--${workout.type}" data-id=${workout.id}>
              <div class="clsWorkoutBtn">
              <a class=" btnWrk btnWrkDel">DEL</a><a class=" btnWrk btnWrkEdit">EDIT</a>  
              </div>
              <h2 class="workout__title">${workout.description}</h2>
              <div class="workout__details">
                <span class="workout__icon">${
                  workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
                }</span>
                <span class="workout__value">${workout.distance}</span>
                <span class="workout__unit">km</span>
              </div>
              <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value">${workout.duration}</span>
                <span class="workout__unit">min</span>
              </div>
          `;
    if (workout.type === "running")
      html += `
            <div class="workout__details">
              <span class="workout__icon">⚡️</span>
              <span class="workout__value">${workout.pace.toFixed(1)}</span>
              <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">🦶🏼</span>
              <span class="workout__value">${workout.cadence}</span>
              <span class="workout__unit">spm</span>
            </div>
          </li>
          `;
    if (workout.type === "cycling")
      html += `
                <div class="workout__details">
                  <span class="workout__icon">⚡️</span>
                  <span class="workout__value">${workout.speed.toFixed(
                    1
                  )}</span>
                  <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                  <span class="workout__icon">🦶🏼</span>
                  <span class="workout__value">${workout.elevationGain}</span>
                  <span class="workout__unit">spm</span>
                </div>
              </li>
              `;
    form.insertAdjacentHTML("afterend", html);
  }
  _moveToPopup(e) {
    const workoutEl = e.target.closest(".workout");
    if (!workoutEl) return;

    //find workout in teh workout array
    console.log(this.#workouts);
    const workout = this.#workouts.find(
      (work) => work.id.trim() === workoutEl.dataset.id.trim()
    );
    this.#mymap.setView(workout.coords, this.#mapZoomLevel, {
      animation: true,
      pan: {
        duration: 1,
      },
    });
    //public interface
    workout.clicks();
    console.log(workout);
  }
  _setToLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach((work) => {
      this._renderWorkout(work);
    });
  }
  _renderMarker(workout) {
    const mark = L.marker(workout.coords).addTo(this.#mymap);
    mark
      .bindPopup(
        L.popup({
          maxWidth: 150,
          minWidth: 50,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(workout.description)
      .openPopup();
  }
  reset() {
    localStorage.removeItem("workouts");
    location.reload();
  }
}
const myapp = new app();
