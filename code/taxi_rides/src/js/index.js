

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