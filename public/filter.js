const filter = document.querySelector('#filter');
const stateCollections = document.querySelectorAll('.name-collection');

// add event listener for filter 
filter.addEventListener('keyup', filterStates);


function filterStates(e) {
  const text = e.target.value.toLowerCase();
  stateCollections.forEach(function (eachState) {
      const item = eachState.firstElementChild.textContent;
      if (item.toLowerCase().indexOf(text) != -1) {
          eachState.style.display = 'block';
      } else {
          eachState.style.display = 'none';
      }
  });
}

