import { useState, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ComposedChart, Area, Cell, Legend, PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

// ── Raw P&L Data (20 months, May 2024 – Dec 2025) ────────────────────────
const RAW = [
  { period:"May-24", brands:[
    {b:"Fomin",units:12609,rev:159119,cost:23508,refRate:.019,refFee:20374,fba:44347,sp:19116,spSales:44292,sb:5351,sbSales:11988,sd:108,sdSales:194,deal:0,storage:327,carrier:4160,inbound:888,lts:9,retFee:64,disposal:6,retProc:0,lowInv:0,adj:0,depr:0,sub:0,gp:32036,gm:.201},
    {b:"House of Party",units:10605,rev:145169,cost:31828,refRate:.070,refFee:19623,fba:42541,sp:16407,spSales:40967,sb:1467,sbSales:4642,sd:0,sdSales:0,deal:0,storage:923,carrier:7131,inbound:0,lts:2573,retFee:0,disposal:0,retProc:0,lowInv:0,adj:0,depr:0,sub:0,gp:12566,gm:.087},
    {b:"Functions Labs",units:1291,rev:17311,cost:2005,refRate:.103,refFee:3114,fba:3959,sp:2841,spSales:8440,sb:1397,sbSales:3415,sd:82,sdSales:67,deal:300,storage:6,carrier:39,inbound:53,lts:34,retFee:0,disposal:0,retProc:0,lowInv:0,adj:0,depr:0,sub:0,gp:1413,gm:.082}
  ]},
  { period:"Jun-24", brands:[
    {b:"Fomin",units:14548,rev:184954,cost:27654,refRate:.019,refFee:24696,fba:52789,sp:18416,spSales:44046,sb:7324,sbSales:19373,sd:213,sdSales:127,deal:0,storage:275,carrier:4328,inbound:322,lts:5,retFee:175,disposal:0,retProc:0,lowInv:0,adj:0,depr:0,sub:0,gp:37632,gm:.203},
    {b:"House of Party",units:13444,rev:166689,cost:39383,refRate:.072,refFee:23001,fba:50127,sp:21622,spSales:55770,sb:1335,sbSales:4733,sd:0,sdSales:0,deal:0,storage:1317,carrier:1654,inbound:0,lts:2520,retFee:0,disposal:0,retProc:805,lowInv:0,adj:0,depr:0,sub:0,gp:17448,gm:.105},
    {b:"Functions Labs",units:1097,rev:14849,cost:1701,refRate:.110,refFee:2633,fba:3401,sp:2475,spSales:6469,sb:1231,sbSales:2891,sd:10,sdSales:15,deal:300,storage:4,carrier:34,inbound:149,lts:34,retFee:0,disposal:0,retProc:0,lowInv:0,adj:0,depr:0,sub:0,gp:1000,gm:.067}
  ]},
  { period:"Jul-24", brands:[
    {b:"Fomin",units:18103,rev:224215,cost:40575,refRate:.021,refFee:64948,fba:29939,sp:18970,spSales:45895,sb:9623,sbSales:25617,sd:0,sdSales:0,deal:0,storage:419,carrier:5479,inbound:23,lts:3,retFee:25,disposal:14,retProc:0,lowInv:0,adj:0,depr:0,sub:0,gp:44826,gm:.209},
    {b:"House of Party",units:15127,rev:182822,cost:42152,refRate:.075,refFee:25178,fba:54925,sp:18706,spSales:51086,sb:1060,sbSales:3310,sd:24,sdSales:1689,deal:0,storage:1786,carrier:2195,inbound:0,lts:2007,retFee:0,disposal:0,retProc:370,lowInv:0,adj:0,depr:0,sub:0,gp:23753,gm:.130},
    {b:"Functions Labs",units:1458,rev:18200,cost:2266,refRate:.115,refFee:3218,fba:4512,sp:2853,spSales:6488,sb:1032,sbSales:2309,sd:0,sdSales:0,deal:300,storage:6,carrier:35,inbound:523,lts:34,retFee:1,disposal:86,retProc:0,lowInv:0,adj:0,depr:0,sub:0,gp:1059,gm:.067}
  ]},
  { period:"Aug-24", brands:[
    {b:"Fomin",units:16409,rev:211786,cost:36912,refRate:.022,refFee:27328,fba:58892,sp:19310,spSales:46859,sb:9701,sbSales:23342,sd:0,sdSales:0,deal:0,storage:462,carrier:4493,inbound:46,lts:0,retFee:0,disposal:15,retProc:0,lowInv:0,adj:0,depr:0,sub:0,gp:43261,gm:.212},
    {b:"House of Party",units:14439,rev:176316,cost:35416,refRate:.069,refFee:25967,fba:53140,sp:17549,spSales:47002,sb:844,sbSales:4973,sd:245,sdSales:128,deal:0,storage:1606,carrier:2423,inbound:0,lts:1764,retFee:0,disposal:383,retProc:0,lowInv:0,adj:0,depr:0,sub:0,gp:29029,gm:.165},
    {b:"Functions Labs",units:1108,rev:15481,cost:1545,refRate:.126,refFee:2703,fba:3433,sp:2425,spSales:6038,sb:418,sbSales:1080,sd:0,sdSales:0,deal:300,storage:0,carrier:0,inbound:180,lts:34,retFee:0,disposal:63,retProc:0,lowInv:0,adj:0,depr:0,sub:0,gp:2147,gm:.139}
  ]},
  { period:"Sep-24", brands:[
    {b:"Fomin",units:13591,rev:178821,cost:31265,refRate:.023,refFee:23812,fba:49854,sp:18185,spSales:45077,sb:8968,sbSales:16375,sd:54,sdSales:47,deal:0,storage:645,carrier:1165,inbound:0,lts:9,retFee:189,disposal:31,retProc:0,lowInv:0,adj:1060,depr:0,sub:40,gp:34254,gm:.190},
    {b:"House of Party",units:14798,rev:177849,cost:37084,refRate:.067,refFee:26119,fba:53650,sp:17299,spSales:47191,sb:1294,sbSales:3547,sd:352,sdSales:226,deal:0,storage:2342,carrier:2122,inbound:755,lts:2347,retFee:1451,disposal:592,retProc:0,lowInv:0,adj:2989,depr:0,sub:40,gp:19024,gm:.107},
    {b:"Functions Labs",units:992,rev:13956,cost:1423,refRate:.098,refFee:2479,fba:3120,sp:2291,spSales:5277,sb:414,sbSales:1126,sd:0,sdSales:0,deal:0,storage:9,carrier:0,inbound:512,lts:34,retFee:1,disposal:46,retProc:0,lowInv:0,adj:154,depr:0,sub:40,gp:1660,gm:.139}
  ]},
  { period:"Oct-24", brands:[
    {b:"Fomin",units:13521,rev:165571,cost:31401,refRate:.022,refFee:21350,fba:49353,sp:16454,spSales:41308,sb:8317,sbSales:18826,sd:0,sdSales:0,deal:0,storage:945,carrier:2484,inbound:579,lts:21,retFee:80,disposal:18,retProc:0,lowInv:0,adj:990,depr:0,sub:40,gp:27187,gm:.172},
    {b:"House of Party",units:22231,rev:231901,cost:46278,refRate:.054,refFee:33904,fba:79315,sp:25733,spSales:70464,sb:1014,sbSales:2062,sd:151,sdSales:158,deal:350,storage:2675,carrier:1173,inbound:253,lts:2147,retFee:168,disposal:919,retProc:0,lowInv:0,adj:1529,depr:0,sub:40,gp:25111,gm:.108},
    {b:"Functions Labs",units:1005,rev:13657,cost:1442,refRate:.026,refFee:2382,fba:3199,sp:1874,spSales:4367,sb:775,sbSales:1753,sd:0,sdSales:0,deal:0,storage:0,carrier:0,inbound:0,lts:34,retFee:0,disposal:48,retProc:0,lowInv:0,adj:113,depr:0,sub:40,gp:1961,gm:.167},
    {b:"Rockport Tools",units:142,rev:4547,cost:1608,refRate:.014,refFee:673,fba:833,sp:1503,spSales:1708,sb:652,sbSales:1383,sd:19,sdSales:70,deal:0,storage:0,carrier:360,inbound:0,lts:66,retFee:2,disposal:0,retProc:0,lowInv:0,adj:27,depr:0,sub:40,gp:1333,gm:.293}
  ]},
  { period:"Nov-24", brands:[
    {b:"Fomin",units:9098,rev:117742,cost:21126,refRate:.020,refFee:15451,fba:35731,sp:14703,spSales:35368,sb:8117,sbSales:16184,sd:7,sdSales:0,deal:0,storage:2506,carrier:2096,inbound:735,lts:0,retFee:629,disposal:8,retProc:0,lowInv:0,adj:1101,depr:0,sub:40,gp:10576,gm:.095},
    {b:"House of Party",units:11627,rev:135745,cost:27095,refRate:.002,refFee:20023,fba:45137,sp:19699,spSales:48262,sb:275,sbSales:1644,sd:135,sdSales:6,deal:300,storage:9100,carrier:327,inbound:798,lts:1940,retFee:0,disposal:759,retProc:0,lowInv:0,adj:2710,depr:0,sub:40,gp:3557,gm:.026},
    {b:"Functions Labs",units:1084,rev:14412,cost:1556,refRate:.020,refFee:2672,fba:3571,sp:1332,spSales:3473,sb:1239,sbSales:2925,sd:0,sdSales:0,deal:0,storage:0,carrier:0,inbound:0,lts:34,retFee:0,disposal:36,retProc:0,lowInv:0,adj:0,depr:0,sub:40,gp:2906,gm:.218},
    {b:"Rockport Tools",units:107,rev:3602,cost:1409,refRate:.112,refFee:488,fba:658,sp:1046,spSales:1746,sb:668,sbSales:1257,sd:69,sdSales:240,deal:0,storage:0,carrier:0,inbound:0,lts:57,retFee:0,disposal:0,retProc:0,lowInv:0,adj:56,depr:0,sub:40,gp:1120,gm:.311}
  ]},
  { period:"Dec-24", brands:[
    {b:"Fomin",units:13808,rev:172969,cost:32145,refRate:.017,refFee:21612,fba:51190,sp:13200,spSales:35143,sb:6971,sbSales:14485,sd:22,sdSales:83,deal:0,storage:2548,carrier:1703,inbound:869,lts:2,retFee:72,disposal:2,retProc:0,lowInv:0,adj:0,depr:0,sub:40,gp:33494,gm:.204},
    {b:"House of Party",units:13698,rev:164561,cost:29202,refRate:.070,refFee:24401,fba:53995,sp:20873,spSales:62595,sb:67,sbSales:323,sd:15,sdSales:131,deal:548,storage:9919,carrier:0,inbound:0,lts:1941,retFee:0,disposal:523,retProc:0,lowInv:0,adj:761,depr:0,sub:40,gp:10676,gm:.065},
    {b:"Functions Labs",units:2236,rev:30733,cost:3212,refRate:.015,refFee:5549,fba:7339,sp:1677,spSales:7330,sb:1202,sbSales:3835,sd:0,sdSales:0,deal:0,storage:17,carrier:0,inbound:0,lts:33,retFee:0,disposal:36,retProc:0,lowInv:0,adj:0,depr:0,sub:40,gp:8290,gm:.303},
    {b:"Rockport Tools",units:105,rev:4084,cost:1794,refRate:.190,refFee:598,fba:749,sp:313,spSales:644,sb:515,sbSales:636,sd:32,sdSales:70,deal:0,storage:75,carrier:0,inbound:0,lts:48,retFee:0,disposal:0,retProc:0,lowInv:0,adj:0,depr:0,sub:40,gp:163,gm:.041}
  ]},
  { period:"Jan-25", brands:[
    {b:"Fomin",units:11945,rev:154988,cost:27100,refRate:.023,refFee:20658,fba:45696,sp:13298,spSales:30624,sb:7752,sbSales:16923,sd:22,sdSales:207,deal:0,storage:2568,carrier:4138,inbound:0,lts:6,retFee:366,disposal:4,retProc:0,lowInv:0,adj:896,depr:0,sub:40,gp:23552,gm:.162},
    {b:"House of Party",units:8707,rev:99028,cost:18731,refRate:.100,refFee:14621,fba:30854,sp:11015,spSales:31998,sb:80,sbSales:390,sd:35,sdSales:1052,deal:0,storage:10861,carrier:119,inbound:48,lts:2063,retFee:613,disposal:1352,retProc:0,lowInv:0,adj:1761,depr:0,sub:40,gp:1611,gm:.020},
    {b:"Functions Labs",units:1188,rev:16487,cost:1658,refRate:.033,refFee:2747,fba:3751,sp:1793,spSales:6014,sb:707,sbSales:2195,sd:0,sdSales:0,deal:0,storage:27,carrier:0,inbound:0,lts:33,retFee:11,disposal:62,retProc:0,lowInv:0,adj:50,depr:0,sub:40,gp:2513,gm:.189}
  ]},
  { period:"Feb-25", brands:[
    {b:"Fomin",units:12346,rev:152865,cost:26854,refRate:.016,refFee:20441,fba:44953,sp:12932,spSales:29478,sb:6114,sbSales:15882,sd:27,sdSales:109,deal:0,storage:875,carrier:1084,inbound:8,lts:13,retFee:59,disposal:2,retProc:0,lowInv:0,adj:1202,depr:0,sub:40,gp:30877,gm:.214},
    {b:"House of Party",units:8588,rev:94840,cost:16881,refRate:.070,refFee:13850,fba:29131,sp:10186,spSales:34150,sb:96,sbSales:632,sd:26,sdSales:693,deal:0,storage:5358,carrier:119,inbound:0,lts:3196,retFee:0,disposal:403,retProc:0,lowInv:0,adj:875,depr:0,sub:40,gp:6864,gm:.070},
    {b:"Functions Labs",units:1060,rev:14613,cost:1520,refRate:.033,refFee:2655,fba:3276,sp:1824,spSales:5468,sb:712,sbSales:1943,sd:35,sdSales:55,deal:0,storage:7,carrier:0,inbound:0,lts:31,retFee:1,disposal:81,retProc:0,lowInv:0,adj:238,depr:0,sub:40,gp:1676,gm:.142}
  ]},
  { period:"Mar-25", brands:[
    {b:"Fomin",units:15567,rev:200077,cost:34278,refRate:.015,refFee:26324,fba:56745,sp:18798,spSales:47243,sb:8752,sbSales:22038,sd:916,sdSales:4886,deal:0,storage:1261,carrier:2638,inbound:47,lts:20,retFee:0,disposal:5,retProc:0,lowInv:0,adj:1378,depr:0,sub:40,gp:39737,gm:.199},
    {b:"House of Party",units:10088,rev:110333,cost:19090,refRate:.060,refFee:15727,fba:32606,sp:12354,spSales:39675,sb:253,sbSales:1950,sd:9,sdSales:38,deal:150,storage:5284,carrier:271,inbound:0,lts:4509,retFee:0,disposal:403,retProc:0,lowInv:0,adj:1666,depr:0,sub:40,gp:10229,gm:.090},
    {b:"Functions Labs",units:1117,rev:14251,cost:1602,refRate:.028,refFee:2633,fba:3466,sp:1435,spSales:3945,sb:1049,sbSales:1943,sd:179,sdSales:306,deal:0,storage:5,carrier:0,inbound:0,lts:31,retFee:0,disposal:106,retProc:0,lowInv:0,adj:157,depr:0,sub:40,gp:1362,gm:.096}
  ]},
  { period:"Apr-25", brands:[
    {b:"Fomin",units:21223,rev:252512,cost:47047,refRate:.018,refFee:29952,fba:73144,sp:18706,spSales:47564,sb:8918,sbSales:22941,sd:750,sdSales:5638,deal:0,storage:1304,carrier:4493,inbound:3,lts:26,retFee:0,disposal:0,retProc:0,lowInv:0,adj:530,depr:0,sub:40,gp:56532,gm:.224},
    {b:"House of Party",units:11436,rev:121994,cost:22818,refRate:.060,refFee:18158,fba:39927,sp:12895,spSales:44538,sb:155,sbSales:1753,sd:9,sdSales:119,deal:0,storage:6261,carrier:1087,inbound:0,lts:5053,retFee:109,disposal:289,retProc:0,lowInv:0,adj:482,depr:0,sub:40,gp:6854,gm:.060},
    {b:"Functions Labs",units:1051,rev:12983,cost:1532,refRate:.033,refFee:2429,fba:3130,sp:1258,spSales:3702,sb:810,sbSales:1918,sd:34,sdSales:0,deal:0,storage:11,carrier:0,inbound:0,lts:26,retFee:0,disposal:68,retProc:0,lowInv:0,adj:0,depr:0,sub:40,gp:1456,gm:.112}
  ]},
  { period:"May-25", brands:[
    {b:"Fomin",units:24895,rev:302484,cost:54278,refRate:.020,refFee:36924,fba:87251,sp:26078,spSales:71740,sb:8328,sbSales:23816,sd:1021,sdSales:8410,deal:450,storage:1389,carrier:2074,inbound:0,lts:49,retFee:0,disposal:4,retProc:0,lowInv:0,adj:1426,depr:0,sub:40,gp:66026,gm:.218},
    {b:"House of Party",units:13579,rev:137900,cost:26182,refRate:.070,refFee:20271,fba:47743,sp:12582,spSales:45321,sb:177,sbSales:1646,sd:13,sdSales:191,deal:0,storage:5177,carrier:430,inbound:126,lts:6898,retFee:682,disposal:424,retProc:0,lowInv:0,adj:1291,depr:0,sub:40,gp:7756,gm:.056},
    {b:"Functions Labs",units:942,rev:11389,cost:1320,refRate:.034,refFee:2068,fba:2844,sp:1328,spSales:3773,sb:843,sbSales:1956,sd:0,sdSales:0,deal:0,storage:10,carrier:0,inbound:0,lts:30,retFee:0,disposal:112,retProc:0,lowInv:0,adj:62,depr:0,sub:40,gp:423,gm:.037}
  ]},
  { period:"Jun-25", brands:[
    {b:"Fomin",units:23535,rev:284024,cost:50598,refRate:.021,refFee:34022,fba:82532,sp:31338,spSales:91764,sb:6975,sbSales:19025,sd:1448,sdSales:7617,deal:1200,storage:1418,carrier:2453,inbound:2,lts:49,retFee:30,disposal:20,retProc:0,lowInv:0,adj:1902,depr:0,sub:40,gp:58922,gm:.208},
    {b:"House of Party",units:11286,rev:113082,cost:20961,refRate:.080,refFee:16961,fba:38885,sp:12029,spSales:42249,sb:129,sbSales:753,sd:18,sdSales:83,deal:0,storage:4836,carrier:0,inbound:0,lts:7944,retFee:2178,disposal:475,retProc:0,lowInv:0,adj:803,depr:0,sub:40,gp:5379,gm:.048},
    {b:"Functions Labs",units:759,rev:8851,cost:1065,refRate:.037,refFee:1600,fba:2216,sp:1429,spSales:3082,sb:479,sbSales:1251,sd:0,sdSales:0,deal:0,storage:8,carrier:0,inbound:0,lts:31,retFee:1,disposal:71,retProc:0,lowInv:0,adj:89,depr:0,sub:40,gp:214,gm:.024}
  ]},
  { period:"Jul-25", brands:[
    {b:"Fomin",units:30058,rev:346920,cost:64079,refRate:.022,refFee:39281,fba:103076,sp:31510,spSales:87587,sb:8504,sbSales:23378,sd:2004,sdSales:13395,deal:292,storage:1453,carrier:4515,inbound:26,lts:39,retFee:9,disposal:0,retProc:0,lowInv:0,adj:1849,depr:0,sub:40,gp:73001,gm:.210},
    {b:"House of Party",units:12413,rev:119287,cost:21686,refRate:.080,refFee:17694,fba:42568,sp:13261,spSales:43916,sb:128,sbSales:601,sd:0,sdSales:0,deal:1100,storage:3754,carrier:0,inbound:14,lts:8055,retFee:75,disposal:297,retProc:0,lowInv:0,adj:1660,depr:0,sub:40,gp:3057,gm:.026},
    {b:"Functions Labs",units:1142,rev:13080,cost:1600,refRate:.020,refFee:2450,fba:3166,sp:1862,spSales:4535,sb:563,sbSales:1593,sd:0,sdSales:0,deal:100,storage:8,carrier:0,inbound:0,lts:31,retFee:0,disposal:90,retProc:0,lowInv:0,adj:55,depr:0,sub:40,gp:1335,gm:.102}
  ]},
  { period:"Aug-25", brands:[
    {b:"Fomin",units:25867,rev:311812,cost:55290,refRate:.021,refFee:36153,fba:90903,sp:34616,spSales:99033,sb:8480,sbSales:25158,sd:1346,sdSales:7564,deal:2294,storage:1565,carrier:860,inbound:1,lts:114,retFee:1205,disposal:1,retProc:0,lowInv:0,adj:1934,depr:0,sub:40,gp:63687,gm:.204},
    {b:"House of Party",units:8799,rev:89479,cost:15604,refRate:.090,refFee:13224,fba:30415,sp:9199,spSales:31725,sb:232,sbSales:766,sd:0,sdSales:0,deal:0,storage:3539,carrier:172,inbound:0,lts:9629,retFee:252,disposal:0,retProc:0,lowInv:0,adj:1445,depr:0,sub:40,gp:1081,gm:.012},
    {b:"Functions Labs",units:1000,rev:13140,cost:1401,refRate:.020,refFee:2509,fba:3093,sp:1782,spSales:5388,sb:335,sbSales:1245,sd:15,sdSales:0,deal:0,storage:15,carrier:0,inbound:0,lts:31,retFee:0,disposal:52,retProc:0,lowInv:0,adj:118,depr:0,sub:40,gp:2473,gm:.188}
  ]},
  { period:"Sep-25", brands:[
    {b:"Fomin",units:25413,rev:301767,cost:55638,refRate:.021,refFee:32741,fba:86331,sp:36915,spSales:105958,sb:8111,sbSales:26230,sd:753,sdSales:2888,deal:1912,storage:2108,carrier:1324,inbound:25,lts:170,retFee:1,disposal:9,retProc:0,lowInv:0,adj:1338,depr:0,sub:40,gp:57391,gm:.190},
    {b:"House of Party",units:7774,rev:78756,cost:14372,refRate:.080,refFee:11684,fba:26618,sp:8303,spSales:29175,sb:233,sbSales:987,sd:0,sdSales:0,deal:0,storage:3359,carrier:0,inbound:0,lts:7493,retFee:456,disposal:7,retProc:0,lowInv:0,adj:451,depr:0,sub:40,gp:826,gm:.011},
    {b:"Roofus Pet",units:556,rev:5653,cost:928,refRate:.131,refFee:347,fba:1964,sp:2938,spSales:3674,sb:33,sbSales:70,sd:0,sdSales:0,deal:0,storage:78,carrier:215,inbound:0,lts:7,retFee:0,disposal:6,retProc:0,lowInv:0,adj:0,depr:0,sub:40,gp:1502,gm:.266},
    {b:"Functions Labs",units:872,rev:11420,cost:1221,refRate:.018,refFee:2175,fba:2692,sp:2290,spSales:5425,sb:487,sbSales:1285,sd:0,sdSales:0,deal:0,storage:14,carrier:0,inbound:0,lts:35,retFee:0,disposal:84,retProc:0,lowInv:0,adj:90,depr:0,sub:40,gp:1154,gm:.101}
  ]},
  { period:"Oct-25", brands:[
    {b:"Fomin",units:25763,rev:301629,cost:55912,refRate:.012,refFee:34159,fba:92631,sp:31459,spSales:83073,sb:8007,sbSales:22411,sd:182,sdSales:2276,deal:3160,storage:2182,carrier:700,inbound:15,lts:246,retFee:0,disposal:106,retProc:0,lowInv:0,adj:852,depr:0,sub:40,gp:51637,gm:.171},
    {b:"Soul Mama",units:1126,rev:13120,cost:1910,refRate:.080,refFee:1291,fba:4462,sp:3944,spSales:8496,sb:0,sbSales:0,sd:0,sdSales:0,deal:0,storage:394,carrier:0,inbound:0,lts:0,retFee:0,disposal:0,retProc:0,lowInv:0,adj:20,depr:0,sub:40,gp:-1851,gm:-.141},
    {b:"Roofus Pet",units:743,rev:6987,cost:1274,refRate:.117,refFee:470,fba:2690,sp:3346,spSales:4845,sb:51,sbSales:85,sd:0,sdSales:0,deal:0,storage:81,carrier:214,inbound:0,lts:1,retFee:0,disposal:2,retProc:0,lowInv:0,adj:17,depr:0,sub:40,gp:-1628,gm:-.233},
    {b:"Functions Labs",units:723,rev:9021,cost:1274,refRate:.021,refFee:1687,fba:2266,sp:1650,spSales:3558,sb:309,sbSales:960,sd:0,sdSales:0,deal:0,storage:13,carrier:0,inbound:0,lts:38,retFee:0,disposal:60,retProc:0,lowInv:0,adj:72,depr:0,sub:40,gp:718,gm:.080},
    {b:"House of Party",units:9783,rev:92392,cost:17323,refRate:.070,refFee:13489,fba:33393,sp:11897,spSales:37839,sb:303,sbSales:804,sd:8,sdSales:53,deal:0,storage:3444,carrier:0,inbound:0,lts:6874,retFee:65,disposal:0,retProc:0,lowInv:0,adj:385,depr:0,sub:40,gp:-183,gm:-.002}
  ]},
  { period:"Nov-25", brands:[
    {b:"Fomin",units:18586,rev:230165,cost:40743,refRate:.008,refFee:26809,fba:70956,sp:26973,spSales:66650,sb:7456,sbSales:22134,sd:310,sdSales:3309,deal:0,storage:7405,carrier:422,inbound:16,lts:582,retFee:9,disposal:273,retProc:0,lowInv:0,adj:778,depr:0,sub:40,gp:30191,gm:.131},
    {b:"Soul Mama",units:1236,rev:14590,cost:2320,refRate:.080,refFee:1451,fba:5343,sp:5116,spSales:9863,sb:222,sbSales:320,sd:0,sdSales:0,deal:0,storage:469,carrier:0,inbound:18,lts:0,retFee:0,disposal:0,retProc:0,lowInv:0,adj:15,depr:0,sub:40,gp:-1749,gm:-.120},
    {b:"Roofus Pet",units:1041,rev:8972,cost:1888,refRate:.064,refFee:585,fba:3918,sp:3818,spSales:5716,sb:80,sbSales:139,sd:0,sdSales:0,deal:0,storage:213,carrier:111,inbound:0,lts:0,retFee:0,disposal:0,retProc:0,lowInv:0,adj:6,depr:0,sub:40,gp:-2732,gm:-.305},
    {b:"Functions Labs",units:885,rev:10108,cost:1239,refRate:.012,refFee:2002,fba:2601,sp:1602,spSales:3883,sb:372,sbSales:1246,sd:0,sdSales:0,deal:0,storage:33,carrier:0,inbound:0,lts:40,retFee:0,disposal:37,retProc:0,lowInv:0,adj:49,depr:0,sub:40,gp:1595,gm:.158}
  ]},
  { period:"Dec-25", brands:[
    {b:"Fomin",units:27411,rev:303003,cost:59951,refRate:.020,refFee:31415,fba:99615,sp:25355,spSales:67122,sb:7250,sbSales:20124,sd:251,sdSales:3790,deal:0,storage:7912,carrier:1591,inbound:0,lts:587,retFee:0,disposal:1815,retProc:0,lowInv:0,adj:1551,depr:0,sub:40,gp:46239,gm:.153},
    {b:"Soul Mama",units:1363,rev:16155,cost:2381,refRate:.019,refFee:1595,fba:5729,sp:4102,spSales:7480,sb:473,sbSales:1276,sd:0,sdSales:0,deal:0,storage:609,carrier:0,inbound:0,lts:0,retFee:0,disposal:0,retProc:0,lowInv:0,adj:61,depr:0,sub:0,gp:171,gm:.011},
    {b:"Roofus Pet",units:1151,rev:10254,cost:1968,refRate:.020,refFee:578,fba:4277,sp:4179,spSales:6627,sb:188,sbSales:259,sd:0,sdSales:0,deal:0,storage:240,carrier:322,inbound:0,lts:4,retFee:0,disposal:0,retProc:0,lowInv:0,adj:5,depr:0,sub:40,gp:-2263,gm:-.221},
    {b:"Functions Labs",units:1328,rev:16599,cost:1861,refRate:.078,refFee:3296,fba:4197,sp:1211,spSales:4006,sb:782,sbSales:2568,sd:0,sdSales:0,deal:0,storage:45,carrier:0,inbound:0,lts:39,retFee:3,disposal:45,retProc:0,lowInv:0,adj:67,depr:0,sub:40,gp:4050,gm:.244}
  ]}
];

// ── V2 Budget Targets (Monthly) ────────────────────────────────────────────
const BUDGETS = {
  "Fomin": { rev: 280000, gm: 0.20, tacos: 0.12 },
  "House of Party": { rev: 120000, gm: 0.10, tacos: 0.15 },
  "Functions Labs": { rev: 15000, gm: 0.15, tacos: 0.18 },
  "Soul Mama": { rev: 20000, gm: 0.10, tacos: 0.25 },
  "Roofus Pet": { rev: 15000, gm: 0.15, tacos: 0.20 },
  "Rockport Tools": { rev: 5000, gm: 0.20, tacos: 0.15 }
};

// ── Team Ownership ────────────────────────────────────────────────────────
const OWNERS = {
  "Fomin": { name: "Team A", avatar: "F" },
  "House of Party": { name: "Team B", avatar: "H" },
  "Functions Labs": { name: "Team C", avatar: "L" },
  "Soul Mama": { name: "Team D", avatar: "S" },
  "Roofus Pet": { name: "Team D", avatar: "R" },
  "Rockport Tools": { name: "Team E", avatar: "T" }
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => n == null ? "—" : n < 0 ? `-$${Math.abs(n).toLocaleString("en-US",{maximumFractionDigits:0})}` : `$${n.toLocaleString("en-US",{maximumFractionDigits:0})}`;
const fmtK = (n) => n == null ? "—" : n >= 1000 ? `$${(n/1000).toFixed(0)}K` : fmt(n);
const fmtPct = (n) => n == null ? "—" : `${(n*100).toFixed(1)}%`;
const fmtNum = (n) => n == null ? "—" : n.toLocaleString("en-US",{maximumFractionDigits:0});
const pctColor = (v,good="up") => {
  if(v==null) return "var(--text-muted)";
  if(good==="up") return v > 0 ? "var(--accent-emerald)" : v < 0 ? "var(--accent-red)" : "var(--text-muted)";
  return v < 0 ? "var(--accent-emerald)" : v > 0 ? "var(--accent-red)" : "var(--text-muted)";
};

const BRAND_COLORS = {
  "Fomin":"#10b981",
  "House of Party":"#f59e0b",
  "Functions Labs":"#8b5cf6",
  "Soul Mama":"#14b8a6",
  "Roofus Pet":"#f43f5e",
  "Rockport Tools":"#ec4899"
};

// ── Compute Enhanced Metrics (V2) ────────────────────────────────────────────
function computeMonth(m, idx, allData) {
  const brands = m.brands.map(b => {
    const totalAd = (b.sp||0)+(b.sb||0)+(b.sd||0);
    const totalAdSales = (b.spSales||0)+(b.sbSales||0)+(b.sdSales||0);
    const tacos = b.rev ? totalAd/b.rev : 0;
    const acos = totalAdSales ? totalAd/totalAdSales : 0;
    const paidRevPct = b.rev ? totalAdSales/b.rev : 0;
    const organicRevPct = 1 - Math.min(paidRevPct, 1);
    const revPerUnit = b.units ? b.rev/b.units : 0;
    const profitPerUnit = b.units ? b.gp/b.units : 0;
    const totalFees = (b.refFee||0)+(b.fba||0)+(b.storage||0)+(b.carrier||0)+(b.inbound||0)+(b.lts||0)+(b.retFee||0)+(b.disposal||0)+(b.retProc||0)+(b.lowInv||0)+(b.deal||0)+(b.sub||0);
    const feeRate = b.rev ? totalFees/b.rev : 0;
    const adRate = b.rev ? totalAd/b.rev : 0;
    const cogsRate = b.rev ? (b.cost||0)/b.rev : 0;
    const storagePct = b.rev ? ((b.storage||0)+(b.lts||0))/b.rev : 0;

    // Budget comparison
    const budget = BUDGETS[b.b] || { rev: b.rev, gm: 0.15, tacos: 0.15 };
    const revVsBudget = budget.rev ? (b.rev - budget.rev) / budget.rev : 0;
    const gmVsBudget = b.gm - budget.gm;
    const tacosVsBudget = tacos - budget.tacos;

    // Health score (0-100)
    let healthScore = 50;
    if(b.gm >= 0.20) healthScore += 20;
    else if(b.gm >= 0.10) healthScore += 10;
    else if(b.gm < 0) healthScore -= 30;
    if(tacos <= 0.12) healthScore += 15;
    else if(tacos <= 0.18) healthScore += 5;
    else if(tacos > 0.25) healthScore -= 15;
    if(organicRevPct >= 0.50) healthScore += 15;
    else if(organicRevPct >= 0.30) healthScore += 5;
    else healthScore -= 10;
    if(b.refRate <= 0.05) healthScore += 10;
    else if(b.refRate > 0.10) healthScore -= 15;
    if(storagePct > 0.05) healthScore -= 10;
    healthScore = Math.max(0, Math.min(100, healthScore));

    const owner = OWNERS[b.b] || { name: "Unassigned", avatar: "?" };

    return {...b, totalAd, totalAdSales, tacos, acos, paidRevPct, organicRevPct, revPerUnit, profitPerUnit, totalFees, feeRate, adRate, cogsRate, storagePct, revVsBudget, gmVsBudget, tacosVsBudget, healthScore, owner};
  });

  const totalRev = brands.reduce((s,b)=>s+b.rev,0);
  const totalGP = brands.reduce((s,b)=>s+b.gp,0);
  const totalAd = brands.reduce((s,b)=>s+b.totalAd,0);
  const totalUnits = brands.reduce((s,b)=>s+b.units,0);
  const totalCost = brands.reduce((s,b)=>s+(b.cost||0),0);
  const totalFees = brands.reduce((s,b)=>s+b.totalFees,0);

  return { ...m, brands, totalRev, totalGP, totalAd, totalUnits, totalCost, totalFees, margin: totalRev?totalGP/totalRev:0, tacos: totalRev?totalAd/totalRev:0 };
}

const DATA = RAW.map((m, idx, arr) => computeMonth(m, idx, arr));

// ── V2: Compute Trailing Averages ────────────────────────────────────────────
function getTrailing(brandName, months, metric) {
  const recent = DATA.slice(-months);
  const values = recent.map(m => {
    const b = m.brands.find(x => x.b === brandName);
    return b ? b[metric] : null;
  }).filter(v => v !== null);
  return values.length ? values.reduce((a,b) => a+b, 0) / values.length : null;
}

// ── V2: YTD Calculations ────────────────────────────────────────────────────
function getYTD(brandName) {
  const ytdMonths = DATA.filter(m => m.period.includes("-25"));
  let totalRev = 0, totalGP = 0, totalUnits = 0, totalAd = 0;
  ytdMonths.forEach(m => {
    const b = m.brands.find(x => x.b === brandName);
    if(b) {
      totalRev += b.rev;
      totalGP += b.gp;
      totalUnits += b.units;
      totalAd += b.totalAd;
    }
  });
  return { rev: totalRev, gp: totalGP, units: totalUnits, ad: totalAd, margin: totalRev ? totalGP/totalRev : 0 };
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────
const CTooltip = ({active,payload,label,formatter}) => {
  if(!active||!payload?.length) return null;
  return (
    <div style={{
      background:"var(--bg-elevated)",border:"1px solid var(--border-medium)",
      borderRadius:12,padding:"14px 18px",fontSize:13,color:"var(--text-primary)",
      boxShadow:"var(--shadow-lg)"
    }}>
      <div style={{fontWeight:700,marginBottom:8,color:"var(--text-secondary)",fontSize:11,textTransform:"uppercase",letterSpacing:1}}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{display:"flex",gap:10,alignItems:"center",marginBottom:4,justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{width:10,height:10,borderRadius:3,background:p.color}}/>
            <span style={{color:"var(--text-muted)"}}>{p.name}</span>
          </div>
          <span style={{fontWeight:700,fontFamily:"var(--font-mono)"}}>{formatter?formatter(p.value):fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ── V2: Brand Health Card ─────────────────────────────────────────────────
const BrandHealthCard = ({ brand, onClick, isSelected }) => {
  const healthColor = brand.healthScore >= 70 ? "var(--accent-emerald)" :
                      brand.healthScore >= 40 ? "var(--accent-amber)" : "var(--accent-red)";
  const healthBg = brand.healthScore >= 70 ? "var(--accent-emerald-soft)" :
                   brand.healthScore >= 40 ? "var(--accent-amber-soft)" : "var(--accent-red-soft)";

  return (
    <div
      onClick={onClick}
      className="card-interactive"
      style={{
        background: isSelected ? "var(--bg-elevated)" : "var(--bg-card)",
        borderRadius: 16, padding: "20px 24px", cursor: "pointer",
        border: isSelected ? `2px solid ${BRAND_COLORS[brand.b]}` : "1px solid var(--border-subtle)",
        transition: "all 0.2s ease"
      }}
    >
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{
            width:40,height:40,borderRadius:10,
            background:BRAND_COLORS[brand.b],
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:16,fontWeight:700,color:"#fff"
          }}>{brand.b.charAt(0)}</div>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:"var(--text-primary)"}}>{brand.b}</div>
            <div style={{fontSize:11,color:"var(--text-muted)"}}>{brand.owner.name}</div>
          </div>
        </div>
        <div style={{
          padding:"6px 12px",borderRadius:20,fontSize:13,fontWeight:700,
          background:healthBg,color:healthColor,fontFamily:"var(--font-mono)"
        }}>{brand.healthScore}</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div>
          <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:1,color:"var(--text-dim)",marginBottom:4}}>Revenue</div>
          <div style={{fontSize:18,fontWeight:700,fontFamily:"var(--font-mono)",color:"var(--text-primary)"}}>{fmtK(brand.rev)}</div>
          <div style={{fontSize:11,color:brand.revVsBudget >= 0 ? "var(--accent-emerald)" : "var(--accent-red)"}}>
            {brand.revVsBudget >= 0 ? "▲" : "▼"} {Math.abs(brand.revVsBudget*100).toFixed(0)}% vs target
          </div>
        </div>
        <div>
          <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:1,color:"var(--text-dim)",marginBottom:4}}>Margin</div>
          <div style={{fontSize:18,fontWeight:700,fontFamily:"var(--font-mono)",color:brand.gm < 0 ? "var(--accent-red)" : brand.gm < 0.10 ? "var(--accent-amber)" : "var(--accent-emerald)"}}>{fmtPct(brand.gm)}</div>
          <div style={{fontSize:11,color:"var(--text-muted)"}}>Target: {fmtPct(BUDGETS[brand.b]?.gm || 0.15)}</div>
        </div>
      </div>

      {/* Mini progress bars */}
      <div style={{marginTop:16,display:"flex",gap:8}}>
        <div style={{flex:1}}>
          <div style={{fontSize:9,color:"var(--text-dim)",marginBottom:4}}>TACoS</div>
          <div style={{height:4,background:"var(--bg-elevated)",borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${Math.min(brand.tacos*100/0.25*100, 100)}%`,background:brand.tacos > 0.20 ? "var(--accent-red)" : brand.tacos > 0.15 ? "var(--accent-amber)" : "var(--accent-emerald)",borderRadius:2}}/>
          </div>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:9,color:"var(--text-dim)",marginBottom:4}}>Organic</div>
          <div style={{height:4,background:"var(--bg-elevated)",borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${brand.organicRevPct*100}%`,background:brand.organicRevPct > 0.50 ? "var(--accent-emerald)" : brand.organicRevPct > 0.30 ? "var(--accent-amber)" : "var(--accent-red)",borderRadius:2}}/>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── V2: Critical Alert Card ─────────────────────────────────────────────────
const AlertCard = ({ alert }) => {
  const icons = { critical: "🚨", warning: "⚠️", info: "💡" };
  const colors = {
    critical: { bg: "var(--accent-red-soft)", border: "rgba(244,63,94,0.3)", text: "#fda4af" },
    warning: { bg: "var(--accent-amber-soft)", border: "rgba(245,158,11,0.3)", text: "#fcd34d" },
    info: { bg: "var(--accent-blue-soft)", border: "rgba(59,130,246,0.3)", text: "#93c5fd" }
  };
  const style = colors[alert.type] || colors.info;

  return (
    <div style={{
      padding:"16px 20px",borderRadius:14,
      background:style.bg,border:`1px solid ${style.border}`,
      marginBottom:12
    }}>
      <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
        <span style={{fontSize:18}}>{icons[alert.type]}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:600,color:style.text,marginBottom:4}}>{alert.title}</div>
          <div style={{fontSize:12,color:"var(--text-secondary)",lineHeight:1.5}}>{alert.message}</div>
          {alert.action && (
            <div style={{marginTop:10,padding:"8px 14px",background:"rgba(0,0,0,0.2)",borderRadius:8,fontSize:12,color:"var(--text-primary)",fontWeight:500}}>
              → {alert.action}
            </div>
          )}
        </div>
        {alert.impact && (
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:10,color:"var(--text-dim)",marginBottom:2}}>IMPACT</div>
            <div style={{fontSize:16,fontWeight:700,fontFamily:"var(--font-mono)",color:style.text}}>{alert.impact}</div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── V2: Executive Summary ─────────────────────────────────────────────────
function ExecSummaryV2() {
  const latest = DATA[DATA.length-1];
  const prev = DATA[DATA.length-2];
  const [selectedBrand, setSelectedBrand] = useState(null);

  // Generate critical alerts
  const alerts = [];
  latest.brands.forEach(b => {
    if(b.gm < 0) {
      alerts.push({
        type: "critical",
        title: `${b.b} is LOSING money`,
        message: `Running at ${fmtPct(b.gm)} margin. Total loss this month: ${fmt(b.gp)}`,
        action: `Review pricing, cut ad spend, or consider pausing`,
        impact: fmt(b.gp)
      });
    } else if(b.gm < 0.05 && b.rev > 50000) {
      alerts.push({
        type: "warning",
        title: `${b.b} margin critically thin`,
        message: `Only ${fmtPct(b.gm)} margin on ${fmtK(b.rev)} revenue. One bad month could flip to loss.`,
        action: `Target 10%+ margin with fee optimization`,
        impact: fmtPct(b.gm)
      });
    }
    if(b.storagePct > 0.03) {
      alerts.push({
        type: "warning",
        title: `${b.b} storage fees spiking`,
        message: `Storage eating ${fmtPct(b.storagePct)} of revenue (${fmt((b.storage||0)+(b.lts||0))}). Industry benchmark: <1%`,
        action: `Run removal order or liquidation sale`,
        impact: fmt((b.storage||0)+(b.lts||0))
      });
    }
    if(b.tacos > 0.22 && b.rev > 20000) {
      alerts.push({
        type: "warning",
        title: `${b.b} TACoS too high`,
        message: `Ad spend is ${fmtPct(b.tacos)} of revenue. Poor organic rank or inefficient campaigns.`,
        action: `Audit SP campaigns, pause low-ROAS keywords`,
        impact: fmtPct(b.tacos)
      });
    }
  });

  // Sort alerts by type
  alerts.sort((a,b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.type] - order[b.type];
  });

  const KPI = ({label,value,sub,change,goodDir}) => (
    <div className="card-interactive" style={{
      background:"linear-gradient(180deg, var(--bg-card) 0%, var(--bg-secondary) 100%)",
      borderRadius:16,padding:"24px 28px",flex:1,minWidth:180
    }}>
      <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:2,color:"var(--text-muted)",marginBottom:12}}>{label}</div>
      <div style={{fontSize:32,fontWeight:700,fontFamily:"var(--font-mono)",color:"var(--text-primary)",letterSpacing:"-0.02em"}}>{value}</div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginTop:12}}>
        {change!=null && (
          <span style={{
            display:"inline-flex",alignItems:"center",gap:4,
            padding:"4px 10px",borderRadius:20,fontSize:12,fontWeight:600,fontFamily:"var(--font-mono)",
            background:pctColor(change,goodDir)==="var(--accent-emerald)"?"var(--accent-emerald-soft)":pctColor(change,goodDir)==="var(--accent-red)"?"var(--accent-red-soft)":"var(--bg-elevated)",
            color:pctColor(change,goodDir)
          }}>
            <span style={{fontSize:10}}>{change>0?"▲":"▼"}</span>
            {change>0?"+":""}{(change*100).toFixed(1)}%
          </span>
        )}
        {sub && <span style={{fontSize:11,color:"var(--text-dim)"}}>{sub}</span>}
      </div>
    </div>
  );

  const revChange = prev.totalRev ? (latest.totalRev - prev.totalRev)/prev.totalRev : 0;
  const gpChange = prev.totalGP ? (latest.totalGP - prev.totalGP)/prev.totalGP : 0;

  return (
    <div>
      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))",gap:16,marginBottom:32}}>
        <KPI label="Revenue" value={fmtK(latest.totalRev)} change={revChange} goodDir="up"/>
        <KPI label="Gross Profit" value={fmtK(latest.totalGP)} change={gpChange} goodDir="up"/>
        <KPI label="Margin" value={fmtPct(latest.margin)} change={latest.margin-prev.margin} goodDir="up"/>
        <KPI label="TACoS" value={fmtPct(latest.tacos)} change={latest.tacos-prev.tacos} goodDir="down"/>
        <KPI label="Units Sold" value={fmtNum(latest.totalUnits)} change={prev.totalUnits?(latest.totalUnits-prev.totalUnits)/prev.totalUnits:0} goodDir="up"/>
      </div>

      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <div style={{marginBottom:32}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <div style={{width:8,height:8,borderRadius:4,background:"var(--accent-red)",animation:"pulse 2s ease-in-out infinite"}}/>
            <span style={{fontSize:14,fontWeight:700,color:"var(--text-primary)",fontFamily:"var(--font-display)"}}>Action Items — {latest.period}</span>
            <span style={{padding:"4px 10px",borderRadius:12,fontSize:11,fontWeight:600,background:"var(--accent-red-soft)",color:"var(--accent-red)"}}>{alerts.filter(a=>a.type==="critical").length} Critical</span>
          </div>
          <div style={{maxHeight:300,overflowY:"auto"}}>
            {alerts.slice(0,5).map((a,i) => <AlertCard key={i} alert={a}/>)}
          </div>
        </div>
      )}

      {/* Brand Health Grid */}
      <div style={{marginBottom:32}}>
        <div style={{fontSize:14,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:1,marginBottom:16}}>Brand Health Scores — {latest.period}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))",gap:16}}>
          {latest.brands.map(b => (
            <BrandHealthCard
              key={b.b}
              brand={b}
              isSelected={selectedBrand === b.b}
              onClick={() => setSelectedBrand(selectedBrand === b.b ? null : b.b)}
            />
          ))}
        </div>
      </div>

      {/* YTD Summary */}
      <div style={{background:"var(--bg-card)",borderRadius:20,padding:24,border:"1px solid var(--border-subtle)"}}>
        <div style={{fontSize:14,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:1,marginBottom:20}}>2025 YTD Performance</div>
        <div style={{overflowX:"auto"}}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{textAlign:"left"}}>Brand</th>
                <th>YTD Revenue</th>
                <th>YTD Profit</th>
                <th>YTD Margin</th>
                <th>YTD Units</th>
                <th>Avg Monthly</th>
                <th>3mo Trend</th>
              </tr>
            </thead>
            <tbody>
              {[...new Set(DATA.flatMap(d => d.brands.map(b => b.b)))].map(brandName => {
                const ytd = getYTD(brandName);
                const avg3mo = getTrailing(brandName, 3, 'gm');
                const avg6mo = getTrailing(brandName, 6, 'gm');
                const trend = avg3mo && avg6mo ? avg3mo - avg6mo : null;
                const monthsActive = DATA.filter(m => m.brands.find(b => b.b === brandName)).length;

                if(ytd.rev === 0) return null;

                return (
                  <tr key={brandName}>
                    <td style={{fontWeight:600,color:BRAND_COLORS[brandName]}}>{brandName}</td>
                    <td>{fmtK(ytd.rev)}</td>
                    <td style={{color:ytd.gp<0?"var(--accent-red)":"var(--accent-emerald)"}}>{fmtK(ytd.gp)}</td>
                    <td style={{color:ytd.margin<0?"var(--accent-red)":ytd.margin<0.10?"var(--accent-amber)":"var(--accent-emerald)"}}>{fmtPct(ytd.margin)}</td>
                    <td>{fmtNum(ytd.units)}</td>
                    <td>{fmtK(ytd.rev/Math.max(monthsActive,1))}</td>
                    <td style={{color:trend>0?"var(--accent-emerald)":trend<0?"var(--accent-red)":"var(--text-muted)"}}>
                      {trend !== null ? `${trend>0?"+":""}${(trend*100).toFixed(1)}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── TABS ────────────────────────────────────────────────────────────────────
const TABS = ["Dashboard","Brand Intel","Trends","Alerts"];

// ── MAIN DASHBOARD V2 ────────────────────────────────────────────────────────
export default function DashboardV2() {
  const [tab, setTab] = useState(0);
  const latest = DATA[DATA.length-1];

  return (
    <div style={{minHeight:"100vh",background:"var(--bg-primary)",color:"var(--text-primary)",fontFamily:"var(--font-body)"}}>
      {/* Header */}
      <header style={{
        position:"sticky",top:0,zIndex:100,
        background:"rgba(10,14,26,0.9)",
        backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",
        borderBottom:"1px solid var(--border-subtle)"
      }}>
        <div style={{maxWidth:1440,margin:"0 auto",padding:"0 32px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 0"}}>
            <div style={{display:"flex",alignItems:"center",gap:16}}>
              <div style={{
                width:44,height:44,borderRadius:12,
                background:"linear-gradient(135deg, #10b981 0%, #059669 100%)",
                display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow:"0 0 30px rgba(16,185,129,0.4)"
              }}>
                <span style={{fontSize:20,fontWeight:800,color:"#fff"}}>P</span>
              </div>
              <div>
                <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:3,color:"var(--text-muted)",fontWeight:600}}>PETRA BRANDS</div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:22,fontWeight:700,color:"var(--text-primary)",fontFamily:"var(--font-display)",letterSpacing:"-0.02em"}}>Command Center</span>
                  <span style={{padding:"3px 8px",borderRadius:6,fontSize:10,fontWeight:700,background:"var(--accent-emerald-soft)",color:"var(--accent-emerald)"}}>V2</span>
                </div>
              </div>
            </div>

            <div style={{display:"flex",alignItems:"center",gap:20}}>
              {/* Live indicator */}
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:8,height:8,borderRadius:4,background:"var(--accent-emerald)",animation:"pulse 2s ease-in-out infinite"}}/>
                <span style={{fontSize:12,color:"var(--text-muted)"}}>Live Data</span>
              </div>

              {/* Quick stats */}
              <div style={{display:"flex",gap:16,padding:"10px 16px",background:"var(--bg-card)",borderRadius:12,border:"1px solid var(--border-subtle)"}}>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:1,color:"var(--text-dim)"}}>Revenue</div>
                  <div style={{fontSize:15,fontWeight:700,fontFamily:"var(--font-mono)",color:"var(--text-primary)"}}>{fmtK(latest.totalRev)}</div>
                </div>
                <div style={{width:1,background:"var(--border-subtle)"}}/>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:1,color:"var(--text-dim)"}}>Margin</div>
                  <div style={{fontSize:15,fontWeight:700,fontFamily:"var(--font-mono)",color:"var(--accent-emerald)"}}>{fmtPct(latest.margin)}</div>
                </div>
                <div style={{width:1,background:"var(--border-subtle)"}}/>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:1,color:"var(--text-dim)"}}>Period</div>
                  <div style={{fontSize:13,fontWeight:600,color:"var(--text-secondary)"}}>{latest.period}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <nav style={{display:"flex",gap:4,paddingBottom:0}}>
            {TABS.map((t,i)=>(
              <button key={t} onClick={()=>setTab(i)} style={{
                padding:"12px 24px",fontSize:13,fontWeight:600,cursor:"pointer",
                border:"none",borderRadius:"12px 12px 0 0",
                background:tab===i?"var(--bg-card)":"transparent",
                color:tab===i?"var(--text-primary)":"var(--text-muted)",
                transition:"all 0.2s ease",fontFamily:"var(--font-body)",
                borderBottom:tab===i?"2px solid var(--accent-emerald)":"2px solid transparent"
              }}>{t}</button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main style={{padding:"32px",maxWidth:1440,margin:"0 auto"}}>
        <div className="animate-fade-in" key={tab}>
          {tab===0 && <ExecSummaryV2/>}
          {tab===1 && <div style={{color:"var(--text-muted)",padding:40,textAlign:"center"}}>Brand Intel - Coming in V2.1</div>}
          {tab===2 && <div style={{color:"var(--text-muted)",padding:40,textAlign:"center"}}>Trends - Coming in V2.1</div>}
          {tab===3 && <div style={{color:"var(--text-muted)",padding:40,textAlign:"center"}}>Alerts Center - Coming in V2.1</div>}
        </div>
      </main>
    </div>
  );
}
