async function init() {

  g_COM.map = new Map();
  g_COM.filter = new Filter();
  g_COM.zones_stat = new Zones_Stat();
  g_COM.zone_stat = new Zone_Stat();

  // init map
  await g_COM.map.init();
  //   g_COM.map.show();
  // init filter
  g_COM.filter.init();
  // init zones stat
  g_COM.zones_stat.init();
  // init zone stat
  g_COM.zone_stat.init();

  await g_COM.filter.update();

};

async function apply_filter() {
  let date = document.getElementById("filter-date").value;
  let ymd = date.split("-");
  date = ymd.reverse().join("-");
  
  let s = document.getElementById("start-time");
  let start_slot = s.options[s.selectedIndex].value;
  s = document.getElementById("end-time")
  let end_slot = s.options[s.selectedIndex].value;
  let yellow = document.getElementById("radio-yellow").checked ? 1 : 0;
  let green = document.getElementById("radio-green").checked ? 1 : 0;
  let supply = document.getElementById("radio-supply").checked ? 1 : 0;
  let demand = document.getElementById("radio-demand").checked ? 1 : 0;
  g_COM.filter.filter = {
    'date': date,
    'start_slot': start_slot,
    'end_slot': end_slot,
    'type': {
      'yellow': yellow,
      'green': green,
      'supply': supply,
      'demand': demand
    }
  };
  console.log(g_COM.filter.filter);
  await g_COM.filter.update();
}