      var g_COM = {
          'map': null,
          'filter': null,
          'zones_stat': null,
          'zone_stat': null,
          'cfg':{
            'num_slot': 144,
            'num_loc': 265
          }
      };

      async function init() {
          g_COM.map = new Map(g_COM);
          g_COM.filter = new Filter(g_COM);
          g_COM.zones_stat = new Zones_Stat(g_COM);
          g_COM.zone_stat = new Zone_Stat(g_COM);

          // init map
          await g_COM.map.init();
          g_COM.map.show();
          // init filter
          g_COM.filter.init();
          // init zones stat
          g_COM.zones_stat.init();
          // init zone stat
          g_COM.zone_stat.init();

      };