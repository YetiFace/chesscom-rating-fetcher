const C = new Event('change');
const form = document.querySelector('form');

form.tclass.addEventListener('change', e => {
  if(form.tclass.value == "none"){
    form.tcontrol.removeAttribute('disabled');
    return;
  }
  form.tcontrol.setAttribute('disabled', '');
});

form.fallgames.addEventListener('change', e => {
  if(e.target.checked){
    form.sdate.setAttribute('disabled', '');
    form.edate.setAttribute('disabled', '');
    return;
  }
  form.sdate.removeAttribute('disabled');
  form.edate.removeAttribute('disabled');
});

[form.sdate, form.edate].forEach(d => {
  d.valueAsDate = new Date();
  d.addEventListener('click', e => {
    e.preventDefault();
    d.showPicker();
  });
});

(new URL(window.location.href)).searchParams.forEach((x, y) => {
    const formEl = form.querySelector(`#${y}`)
    if(formEl.type=='checkbox'){
      formEl.checked = true
    } else {
      formEl.value = x;
    }
    formEl.dispatchEvent(C);
  });

form.addEventListener('submit', e => {
  e.preventDefault();
  form.ccuser.value = form.ccuser.value.trim();
  if(form.tclass.value == "none"){
    form.tcontrol.value = form.tcontrol.value.replace(/ /g,'');
  } else {
    form.tcontrol.removeAttribute('disabled', '');
  }
  form.submit();
  if(form.tclass.value != "none"){
    form.tcontrol.setAttribute('disabled', '');
  }
});

