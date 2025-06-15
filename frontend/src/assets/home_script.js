/*window.onload = function () {
  const filterBtn = document.getElementById('filterBtn');
  const filterSection = document.getElementById('menu-panel');
 
  if (filterBtn) {
  filterBtn.addEventListener('click', () => {
    
    toggleSection(filterSection);
    
  });

 
  }
  function toggleSection(section) {
    if (section.style.display === 'block') {
      section.style.display = 'none';
    } else {
      section.style.display = 'block';
    }
  }

 
}*/

function toggleSection(section) {
  if (section.style.display === 'block') {
    section.style.display = 'none';
  } else {
    section.style.display = 'block';
  }
}

// Esporta la funzione nel contesto globale se necessario
window.toggleSection = toggleSection;
