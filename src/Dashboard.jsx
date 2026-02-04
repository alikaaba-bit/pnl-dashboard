import { useState, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ComposedChart, Area, Cell, Legend, PieChart, Pie } from "recharts";

// ── Raw P&L Data (20 months, May 2024 – Dec 2025) ────────────────────────
const RAW = [
  { period:"May-24", brands:[
    {b:"Fomin",units:12609,rev:159119,cost:23508,refRate:.019,refFee:20374,fba:44347,sp:19116,spSales:44292,sb:5351,sbSales:11988,sd:108,sdSales:194,deal:0,storage:327,carrier:4160,inbound:888,lts:9,retFee:64,disposal:6,retProc:0,lowInv:0,adj:0,depr:0,sub:0,gp:32036,gm:.201},
    {b:"House of Party",units:10605,rev:145169,cost:31828,refRate:.070,refFee:19623,fba:42541,sp:16407,spSales:40967,sb:1467,sbSales:4642,sd:0,sdSales:0,deal:0,storage:923,carrier:7131,inbound:0,lts:2573,retFee:0,disposal:0,retProc:0,lowInv:0,adj:0,depr:0,sub:0,gp:12566,gm:.087},
    {b:"Functions Labs",units:1291,rev:17311,cost:2005,refRate:.103,refFee:3114,fba:3959,sp:2841,spSales:8440,sb:1397,sbSales:3415,sd:82,sdSales:67,deal:300,storage:6,carrier:39,inbound:53,lts:34,retFee:0,disposal:0,retProc:0,lowInv:0,adj:0,depr:0,sub:0,gp:1413,gm:.082},
    {b:"Custom Products",units:597,rev:29909,cost:12369,refRate:.034,refFee:4438,fba:0,sp:4851,spSales:12298,sb:2788,sbSales:9644,sd:0,sdSales:0,deal:0,storage:0,carrier:0,inbound:0,lts:0,retFee:0,disposal:0,retProc:0,lowInv:0,adj:0,depr:0,sub:0,gp:4906,gm:.170}
  ]},
  { period:"Jun-24", brands:[
    {b:"Fomin",units:14548,rev:184954,cost:27654,refRate:.019,refFee:24696,fba:52789,sp:18416,spSales:44046,sb:7324,sbSales:19373,sd:213,sdSales:127,deal:0,storage:275,carrier:4328,inbound:322,lts:5,retFee:175,disposal:0,retProc:0,lowInv:0,adj:0,depr:0,sub:0,gp:37632,gm:.203},
    {b:"House of Party",units:13444,rev:166689,cost:39383,refRate:.072,refFee:23001,fba:50127,sp:21622,spSales:55770,sb:1335,sbSales:4733,sd:0,sdSales:0,deal:0,storage:1317,carrier:1654,inbound:0,lts:2520,retFee:0,disposal:0,retProc:805,lowInv:0,adj:0,depr:0,sub:0,gp:17448,gm:.105},
    {b:"Functions Labs",units:1097,rev:14849,cost:1701,refRate:.110,refFee:2633,fba:3401,sp:2475,spSales:6469,sb:1231,sbSales:2891,sd:10,sdSales:15,deal:300,storage:4,carrier:34,inbound:149,lts:34,retFee:0,disposal:0,retProc:0,lowInv:0,adj:0,depr:0,sub:0,gp:1000,gm:.067},
    {b:"Custom Products",units:593,rev:26442,cost:11618,refRate:.003,refFee:4235,fba:0,sp:4994,spSales:10990,sb:3291,sbSales:7742,sd:0,sdSales:0,deal:0,storage:0,carrier:0,inbound:0,lts:0,retFee:0,disposal:0,retProc:0,lowInv:0,adj:0,depr:459,sub:0,gp:4095,gm:.138}
  ]},
  { period:"Jul-24", brands:[
    {b:"Fomin",units:18103,rev:224215,cost:40575,refRate:.021,refFee:64948,fba:29939,sp:18970,spSales:45895,sb:9623,sbSales:25617,sd:0,sdSales:0,deal:0,storage:419,carrier:5479,inbound:23,lts:3,retFee:25,disposal:14,retProc:0,lowInv:0,adj:0,depr:0,sub:0,gp:44826,gm:.209},
    {b:"House of Party",units:15127,rev:182822,cost:42152,refRate:.075,refFee:25178,fba:54925,sp:18706,spSales:51086,sb:1060,sbSales:3310,sd:24,sdSales:1689,deal:0,storage:1786,carrier:2195,inbound:0,lts:2007,retFee:0,disposal:0,retProc:370,lowInv:0,adj:0,depr:0,sub:0,gp:23753,gm:.130},
    {b:"Functions Labs",units:1458,rev:18200,cost:2266,refRate:.115,refFee:3218,fba:4512,sp:2853,spSales:6488,sb:1032,sbSales:2309,sd:0,sdSales:0,deal:300,storage:6,carrier:35,inbound:523,lts:34,retFee:1,disposal:86,retProc:0,lowInv:0,adj:0,depr:0,sub:0,gp:1059,gm:.067},
    {b:"Custom Products",units:765,rev:33924,cost:15097,refRate:.013,refFee:5031,fba:0,sp:8653,spSales:15614,sb:4111,sbSales:9053,sd:0,sdSales:0,deal:0,storage:0,carrier:0,inbound:0,lts:0,retFee:0,disposal:0,retProc:0,lowInv:0,adj:0,depr:443,sub:0,gp:222,gm:.007}
  ]},
  { period:"Aug-24", brands:[
    {b:"Fomin",units:16409,rev:211786,cost:36912,refRate:.022,refFee:27328,fba:58892,sp:19310,spSales:46859,sb:9701,sbSales:23342,sd:0,sdSales:0,deal:0,storage:462,carrier:4493,inbound:46,lts:0,retFee:0,disposal:15,retProc:0,lowInv:0,adj:0,depr:0,sub:0,gp:43261,gm:.212},
    {b:"House of Party",units:14439,rev:176316,cost:35416,refRate:.069,refFee:25967,fba:53140,sp:17549,spSales:47002,sb:844,sbSales:4973,sd:245,sdSales:128,deal:0,storage:1606,carrier:2423,inbound:0,lts:1764,retFee:0,disposal:383,retProc:0,lowInv:0,adj:0,depr:0,sub:0,gp:29029,gm:.165},
    {b:"Functions Labs",units:1108,rev:15481,cost:1545,refRate:.126,refFee:2703,fba:3433,sp:2425,spSales:6038,sb:418,sbSales:1080,sd:0,sdSales:0,deal:300,storage:0,carrier:0,inbound:180,lts:34,retFee:0,disposal:63,retProc:0,lowInv:0,adj:0,depr:0,sub:0,gp:2147,gm:.139},
    {b:"Custom Products",units:587,rev:27782,cost:11716,refRate:.017,refFee:4204,fba:0,sp:5117,spSales:12885,sb:1771,sbSales:4531,sd:0,sdSales:0,deal:0,storage:0,carrier:0,inbound:0,lts:0,retFee:0,disposal:0,retProc:0,lowInv:0,adj:0,depr:365,sub:0,gp:4531,gm:.163}
  ]},
  { period:"Sep-24", brands:[
    {b:"Fomin",units:13591,rev:178821,cost:31265,refRate:.023,refFee:23812,fba:49854,sp:18185,spSales:45077,sb:8968,sbSales:16375,sd:54,sdSales:47,deal:0,storage:645,carrier:1165,inbound:0,lts:9,retFee:189,disposal:31,retProc:0,lowInv:0,adj:1060,depr:0,sub:40,gp:34254,gm:.190},
    {b:"House of Party",units:14798,rev:177849,cost:37084,refRate:.067,refFee:26119,fba:53650,sp:17299,spSales:47191,sb:1294,sbSales:3547,sd:352,sdSales:226,deal:0,storage:2342,carrier:2122,inbound:755,lts:2347,retFee:1451,disposal:592,retProc:0,lowInv:0,adj:2989,depr:0,sub:40,gp:19024,gm:.107},
    {b:"Functions Labs",units:992,rev:13956,cost:1423,refRate:.098,refFee:2479,fba:3120,sp:2291,spSales:5277,sb:414,sbSales:1126,sd:0,sdSales:0,deal:0,storage:9,carrier:0,inbound:512,lts:34,retFee:1,disposal:46,retProc:0,lowInv:0,adj:154,depr:0,sub:40,gp:1660,gm:.139},
    {b:"Custom Products",units:711,rev:26330,cost:11041,refRate:.006,refFee:4037,fba:0,sp:4360,spSales:12545,sb:1122,sbSales:3544,sd:0,sdSales:0,deal:0,storage:0,carrier:0,inbound:0,lts:0,retFee:0,disposal:0,retProc:0,lowInv:0,adj:0,depr:479,sub:40,gp:6028,gm:.230}
  ]},
  { period:"Oct-24", brands:[
    {b:"Fomin",units:13521,rev:165571,cost:31401,refRate:.022,refFee:21350,fba:49353,sp:16454,spSales:41308,sb:8317,sbSales:18826,sd:0,sdSales:0,deal:0,storage:945,carrier:2484,inbound:579,lts:21,retFee:80,disposal:18,retProc:0,lowInv:0,adj:990,depr:0,sub:40,gp:27187,gm:.172},
    {b:"House of Party",units:22231,rev:231901,cost:46278,refRate:.054,refFee:33904,fba:79315,sp:25733,spSales:70464,sb:1014,sbSales:2062,sd:151,sdSales:158,deal:350,storage:2675,carrier:1173,inbound:253,lts:2147,retFee:168,disposal:919,retProc:0,lowInv:0,adj:1529,depr:0,sub:40,gp:25111,gm:.108},
    {b:"Functions Labs",units:1005,rev:13657,cost:1442,refRate:.026,refFee:2382,fba:3199,sp:1874,spSales:4367,sb:775,sbSales:1753,sd:0,sdSales:0,deal:0,storage:0,carrier:0,inbound:0,lts:34,retFee:0,disposal:48,retProc:0,lowInv:0,adj:113,depr:0,sub:40,gp:1961,gm:.167},
    {b:"Rockport Tools",units:142,rev:4547,cost:1608,refRate:.014,refFee:673,fba:833,sp:1503,spSales:1708,sb:652,sbSales:1383,sd:19,sdSales:70,deal:0,storage:0,carrier:360,inbound:0,lts:66,retFee:2,disposal:0,retProc:0,lowInv:0,adj:27,depr:0,sub:40,gp:1333,gm:.293},
    {b:"Custom Products",units:664,rev:20240,cost:8703,refRate:0,refFee:3017,fba:0,sp:4549,spSales:9113,sb:1100,sbSales:2251,sd:0,sdSales:0,deal:0,storage:0,carrier:0,inbound:0,lts:0,retFee:0,disposal:0,retProc:0,lowInv:0,adj:0,depr:239,sub:40,gp:1207,gm:.089}
  ]},
  { period:"Nov-24", brands:[
    {b:"Fomin",units:9098,rev:117742,cost:21126,refRate:.020,refFee:15451,fba:35731,sp:14703,spSales:35368,sb:8117,sbSales:16184,sd:7,sdSales:0,deal:0,storage:2506,carrier:2096,inbound:735,lts:0,retFee:629,disposal:8,retProc:0,lowInv:0,adj:1101,depr:0,sub:40,gp:10576,gm:.095},
    {b:"House of Party",units:11627,rev:135745,cost:27095,refRate:.002,refFee:20023,fba:45137,sp:19699,spSales:48262,sb:275,sbSales:1644,sd:135,sdSales:6,deal:300,storage:9100,carrier:327,inbound:798,lts:1940,retFee:0,disposal:759,retProc:0,lowInv:0,adj:2710,depr:0,sub:40,gp:3557,gm:.026},
    {b:"Functions Labs",units:1084,rev:14412,cost:1556,refRate:.020,refFee:2672,fba:3571,sp:1332,spSales:3473,sb:1239,sbSales:2925,sd:0,sdSales:0,deal:0,storage:0,carrier:0,inbound:0,lts:34,retFee:0,disposal:36,retProc:0,lowInv:0,adj:0,depr:0,sub:40,gp:2906,gm:.218},
    {b:"Rockport Tools",units:107,rev:3602,cost:1409,refRate:.112,refFee:488,fba:658,sp:1046,spSales:1746,sb:668,sbSales:1257,sd:69,sdSales:240,deal:0,storage:0,carrier:0,inbound:0,lts:57,retFee:0,disposal:0,retProc:0,lowInv:0,adj:56,depr:0,sub:40,gp:1120,gm:.311},
    {b:"Custom Products",units:890,rev:21486,cost:10285,refRate:0,refFee:3127,fba:0,sp:6924,spSales:11882,sb:2490,sbSales:5073,sd:0,sdSales:0,deal:0,storage:0,carrier:0,inbound:0,lts:0,retFee:0,disposal:0,retProc:0,lowInv:0,adj:0,depr:0,sub:40,gp:3423,gm:.159}
  ]},
  { period:"Dec-24", brands:[
    {b:"Fomin",units:13808,rev:172969,cost:32145,refRate:.017,refFee:21612,fba:51190,sp:13200,spSales:35143,sb:6971,sbSales:14485,sd:22,sdSales:83,deal:0,storage:2548,carrier:1703,inbound:869,lts:2,retFee:72,disposal:2,retProc:0,lowInv:0,adj:0,depr:0,sub:40,gp:33494,gm:.204},
    {b:"House of Party",units:13698,rev:164561,cost:29202,refRate:.070,refFee:24401,fba:53995,sp:20873,spSales:62595,sb:67,sbSales:323,sd:15,sdSales:131,deal:548,storage:9919,carrier:0,inbound:0,lts:1941,retFee:0,disposal:523,retProc:0,lowInv:0,adj:761,depr:0,sub:40,gp:10676,gm:.065},
    {b:"Functions Labs",units:2236,rev:30733,cost:3212,refRate:.015,refFee:5549,fba:7339,sp:1677,spSales:7330,sb:1202,sbSales:3835,sd:0,sdSales:0,deal:0,storage:17,carrier:0,inbound:0,lts:33,retFee:0,disposal:36,retProc:0,lowInv:0,adj:0,depr:0,sub:40,gp:8290,gm:.303},
    {b:"Rockport Tools",units:105,rev:4084,cost:1794,refRate:.190,refFee:598,fba:749,sp:313,spSales:644,sb:515,sbSales:636,sd:32,sdSales:70,deal:0,storage:75,carrier:0,inbound:0,lts:48,retFee:0,disposal:0,retProc:0,lowInv:0,adj:0,depr:0,sub:40,gp:163,gm:.041},
    {b:"Custom Products",units:597,rev:13306,cost:6439,refRate:0,refFee:1961,fba:0,sp:3447,spSales:4757,sb:1383,sbSales:5416,sd:0,sdSales:0,deal:0,storage:0,carrier:0,inbound:0,lts:0,retFee:0,disposal:0,retProc:0,lowInv:0,adj:0,depr:0,sub:40,gp:162,gm:.012}
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

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => n == null ? "—" : n < 0 ? `-$${Math.abs(n).toLocaleString("en-US",{maximumFractionDigits:0})}` : `$${n.toLocaleString("en-US",{maximumFractionDigits:0})}`;
const fmtK = (n) => n == null ? "—" : n >= 1000 ? `$${(n/1000).toFixed(0)}K` : fmt(n);
const fmtPct = (n) => n == null ? "—" : `${(n*100).toFixed(1)}%`;
const fmtNum = (n) => n == null ? "—" : n.toLocaleString("en-US",{maximumFractionDigits:0});
const pctColor = (v,good="up") => {
  if(v==null) return "#64748b";
  if(good==="up") return v > 0 ? "#22c55e" : v < 0 ? "#ef4444" : "#64748b";
  return v < 0 ? "#22c55e" : v > 0 ? "#ef4444" : "#64748b";
};
const BRAND_COLORS = {"Fomin":"#10b981","House of Party":"#f59e0b","Functions Labs":"#8b5cf6","Custom Products":"#6b7280","Rockport Tools":"#ec4899","Soul Mama":"#14b8a6","Roofus Pet":"#f43f5e"};

// ── V2: Budget Targets (Monthly) ────────────────────────────────────────────
const BUDGETS = {
  "Fomin": { rev: 280000, gm: 0.20, tacos: 0.12 },
  "House of Party": { rev: 120000, gm: 0.10, tacos: 0.15 },
  "Functions Labs": { rev: 15000, gm: 0.15, tacos: 0.18 },
  "Soul Mama": { rev: 20000, gm: 0.10, tacos: 0.25 },
  "Roofus Pet": { rev: 15000, gm: 0.15, tacos: 0.20 },
  "Rockport Tools": { rev: 5000, gm: 0.20, tacos: 0.15 }
};

// ── V2: Team Ownership ────────────────────────────────────────────────────────
const OWNERS = {
  "Fomin": { name: "Team A", avatar: "F" },
  "House of Party": { name: "Team B", avatar: "H" },
  "Functions Labs": { name: "Team C", avatar: "L" },
  "Soul Mama": { name: "Team D", avatar: "S" },
  "Roofus Pet": { name: "Team D", avatar: "R" },
  "Rockport Tools": { name: "Team E", avatar: "T" }
};

// ── Compute Enhanced Metrics (V2 Enhanced) ────────────────────────────────────
function computeMonth(m) {
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

    // V2: Budget comparison
    const budget = BUDGETS[b.b] || { rev: b.rev, gm: 0.15, tacos: 0.15 };
    const revVsBudget = budget.rev ? (b.rev - budget.rev) / budget.rev : 0;

    // V2: Health score (0-100)
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

    return {...b, totalAd, totalAdSales, tacos, acos, paidRevPct, organicRevPct, revPerUnit, profitPerUnit, totalFees, feeRate, adRate, cogsRate, storagePct, revVsBudget, healthScore, owner};
  });
  const totalRev = brands.reduce((s,b)=>s+b.rev,0);
  const totalGP = brands.reduce((s,b)=>s+b.gp,0);
  const totalAd = brands.reduce((s,b)=>s+b.totalAd,0);
  const totalUnits = brands.reduce((s,b)=>s+b.units,0);
  const totalCost = brands.reduce((s,b)=>s+(b.cost||0),0);
  const totalFees = brands.reduce((s,b)=>s+b.totalFees,0);
  return { ...m, brands, totalRev, totalGP, totalAd, totalUnits, totalCost, totalFees, margin: totalRev?totalGP/totalRev:0, tacos: totalRev?totalAd/totalRev:0 };
}

const DATA = RAW.map(computeMonth);

// ── V2: YTD Calculations ────────────────────────────────────────────────────
function getYTD(brandName) {
  const ytdMonths = DATA.filter(m => m.period.includes("-25"));
  let totalRev = 0, totalGP = 0, totalUnits = 0;
  ytdMonths.forEach(m => {
    const b = m.brands.find(x => x.b === brandName);
    if(b) { totalRev += b.rev; totalGP += b.gp; totalUnits += b.units; }
  });
  return { rev: totalRev, gp: totalGP, units: totalUnits, margin: totalRev ? totalGP/totalRev : 0 };
}

// ── V2: Trailing Averages ────────────────────────────────────────────────────
function getTrailing(brandName, months, metric) {
  const recent = DATA.slice(-months);
  const values = recent.map(m => {
    const b = m.brands.find(x => x.b === brandName);
    return b ? b[metric] : null;
  }).filter(v => v !== null);
  return values.length ? values.reduce((a,b) => a+b, 0) / values.length : null;
}

// ── Tab definitions ────────────────────────────────────────────────────────
const TABS = ["Executive Summary","P&L Waterfall","Brand Deep Dive","Advertising Intel","Fee Forensics","Gaps & Recommendations"];

// ── Custom Tooltip ─────────────────────────────────────────────────────────
const CTooltip = ({active,payload,label,formatter}) => {
  if(!active||!payload?.length) return null;
  return (
    <div style={{
      background:"var(--bg-elevated)",
      border:"1px solid var(--border-medium)",
      borderRadius:12,padding:"14px 18px",fontSize:13,color:"var(--text-primary)",
      boxShadow:"var(--shadow-lg)",backdropFilter:"blur(8px)"
    }}>
      <div style={{fontWeight:700,marginBottom:8,color:"var(--text-secondary)",fontSize:11,textTransform:"uppercase",letterSpacing:1}}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{display:"flex",gap:10,alignItems:"center",marginBottom:4,justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{width:10,height:10,borderRadius:3,background:p.color,display:"inline-block"}}/>
            <span style={{color:"var(--text-muted)"}}>{p.name}</span>
          </div>
          <span style={{fontWeight:700,color:"var(--text-primary)",fontFamily:"var(--font-mono)"}}>{formatter?formatter(p.value):fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ── EXECUTIVE SUMMARY ─────────────────────────────────────────────────────
function ExecSummary() {
  const latest = DATA[DATA.length-1];
  const prev = DATA[DATA.length-2];
  const yoyIdx = DATA.length >= 13 ? DATA.length-13 : 0;
  const yoy = DATA[yoyIdx];
  
  const revChange = prev.totalRev ? (latest.totalRev - prev.totalRev)/prev.totalRev : 0;
  const gpChange = prev.totalGP ? (latest.totalGP - prev.totalGP)/prev.totalGP : 0;
  const yoyRevChange = yoy.totalRev ? (latest.totalRev - yoy.totalRev)/yoy.totalRev : 0;

  // Trend data
  const trendData = DATA.map(d => ({
    period: d.period,
    revenue: d.totalRev,
    profit: d.totalGP,
    margin: d.margin*100,
    tacos: d.tacos*100,
    units: d.totalUnits
  }));

  // Alerts
  const alerts = [];
  latest.brands.forEach(b => {
    if(b.gm < 0) alerts.push({type:"critical",msg:`${b.b} is LOSING money (${fmtPct(b.gm)} margin)`});
    else if(b.gm < 0.05) alerts.push({type:"warning",msg:`${b.b} margin critically thin at ${fmtPct(b.gm)}`});
    if(b.tacos > 0.20) alerts.push({type:"warning",msg:`${b.b} TACoS at ${fmtPct(b.tacos)} — ad dependency too high`});
    if(b.refRate > 0.08) alerts.push({type:"warning",msg:`${b.b} refund rate at ${fmtPct(b.refRate)}`});
    if(b.lts > b.rev*0.02) alerts.push({type:"warning",msg:`${b.b} long-term storage fees eating ${fmtPct(b.lts/b.rev)} of revenue`});
  });
  if(latest.margin < 0.10) alerts.push({type:"critical",msg:`Portfolio margin dropped to ${fmtPct(latest.margin)} — below 10% threshold`});

  const KPI = ({label,value,sub,change,goodDir,icon}) => (
    <div className="card-interactive" style={{
      background:"linear-gradient(180deg, var(--bg-card) 0%, var(--bg-secondary) 100%)",
      borderRadius:16,padding:"24px 28px",flex:1,minWidth:200,
      position:"relative",overflow:"hidden"
    }}>
      {/* Subtle glow for positive metrics */}
      {goodDir==="up" && change > 0 && <div style={{position:"absolute",top:0,right:0,width:100,height:100,background:"radial-gradient(circle at 100% 0%, rgba(16,185,129,0.1) 0%, transparent 70%)",pointerEvents:"none"}}/>}
      <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:2,color:"var(--text-muted)",marginBottom:12,fontWeight:600,fontFamily:"var(--font-body)"}}>{label}</div>
      <div style={{fontSize:32,fontWeight:700,color:"var(--text-primary)",fontFamily:"var(--font-mono)",letterSpacing:"-0.02em",lineHeight:1}}>{value}</div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginTop:12}}>
        {change!=null && (
          <span style={{
            display:"inline-flex",alignItems:"center",gap:4,
            padding:"4px 10px",borderRadius:20,fontSize:12,fontWeight:600,
            fontFamily:"var(--font-mono)",
            background:pctColor(change,goodDir)==="#22c55e"?"var(--accent-emerald-soft)":pctColor(change,goodDir)==="#ef4444"?"var(--accent-red-soft)":"var(--bg-elevated)",
            color:pctColor(change,goodDir)==="#22c55e"?"var(--accent-emerald)":pctColor(change,goodDir)==="#ef4444"?"var(--accent-red)":"var(--text-secondary)"
          }}>
            <span style={{fontSize:10}}>{change>0?"▲":"▼"}</span>
            {change>0?"+":""}{(change*100).toFixed(1)}%
          </span>
        )}
        {sub && <span style={{fontSize:11,color:"var(--text-dim)"}}>{sub}</span>}
      </div>
    </div>
  );

  return (
    <div>
      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{marginBottom:28}} className="animate-fade-in">
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <div style={{width:8,height:8,borderRadius:4,background:"var(--accent-red)",animation:"pulse 2s ease-in-out infinite"}}/>
            <span style={{fontSize:12,fontWeight:700,color:"var(--accent-red)",textTransform:"uppercase",letterSpacing:1.5,fontFamily:"var(--font-body)"}}>Action Required — {latest.period}</span>
          </div>
          <div style={{display:"grid",gap:8}}>
            {alerts.map((a,i) => (
              <div key={i} className="animate-slide-in" style={{
                padding:"14px 18px",borderRadius:12,fontSize:13,fontWeight:500,
                background:a.type==="critical"?"var(--accent-red-soft)":"var(--accent-amber-soft)",
                border:`1px solid ${a.type==="critical"?"rgba(244,63,94,0.25)":"rgba(245,158,11,0.25)"}`,
                color:a.type==="critical"?"#fda4af":"#fcd34d",
                display:"flex",alignItems:"center",gap:12,
                fontFamily:"var(--font-body)",animationDelay:`${i*50}ms`
              }}>
                <span style={{fontSize:10,opacity:0.8}}>{a.type==="critical"?"●":"●"}</span>
                {a.msg}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:16,marginBottom:32}}>
        <KPI label="Revenue" value={fmtK(latest.totalRev)} change={revChange} goodDir="up" sub={`YoY: ${yoyRevChange>0?"+":""}${(yoyRevChange*100).toFixed(0)}%`}/>
        <KPI label="Gross Profit" value={fmtK(latest.totalGP)} change={gpChange} goodDir="up"/>
        <KPI label="Margin" value={fmtPct(latest.margin)} change={latest.margin-prev.margin} goodDir="up"/>
        <KPI label="TACoS" value={fmtPct(latest.tacos)} change={latest.tacos-prev.tacos} goodDir="down"/>
        <KPI label="Units" value={fmtNum(latest.totalUnits)} change={prev.totalUnits?(latest.totalUnits-prev.totalUnits)/prev.totalUnits:0} goodDir="up"/>
      </div>

      {/* Revenue + Profit Trend */}
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:20,marginBottom:32}}>
        <div style={{background:"var(--bg-card)",borderRadius:20,padding:24,border:"1px solid var(--border-subtle)",boxShadow:"var(--shadow-sm)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <div style={{fontSize:14,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:1,fontFamily:"var(--font-body)"}}>Revenue & Profit Trend</div>
            <div style={{display:"flex",gap:12}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{width:10,height:3,borderRadius:2,background:"var(--accent-blue)"}}/>
              <span style={{fontSize:11,color:"var(--text-muted)"}}>Revenue</span></div>
              <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{width:10,height:10,borderRadius:2,background:"var(--accent-emerald)"}}/>
              <span style={{fontSize:11,color:"var(--text-muted)"}}>Profit</span></div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
              <XAxis dataKey="period" tick={{fontSize:10,fill:"#64748b"}} interval={1}/>
              <YAxis tick={{fontSize:10,fill:"#64748b"}} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`}/>
              <Tooltip content={<CTooltip/>}/>
              <Area dataKey="revenue" fill="rgba(59,130,246,0.1)" stroke="#3b82f6" strokeWidth={2} name="Revenue"/>
              <Bar dataKey="profit" fill="#22c55e" radius={[3,3,0,0]} name="Gross Profit" barSize={16}/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:"var(--bg-card)",borderRadius:20,padding:24,border:"1px solid var(--border-subtle)",boxShadow:"var(--shadow-sm)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <div style={{fontSize:14,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:1,fontFamily:"var(--font-body)"}}>Margin vs TACoS</div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
              <XAxis dataKey="period" tick={{fontSize:10,fill:"#64748b"}} interval={2}/>
              <YAxis tick={{fontSize:10,fill:"#64748b"}} tickFormatter={v=>`${v}%`} domain={[0,'auto']}/>
              <Tooltip content={<CTooltip formatter={v=>`${v.toFixed(1)}%`}/>}/>
              <Line dataKey="margin" stroke="#22c55e" strokeWidth={2} dot={false} name="Margin %"/>
              <Line dataKey="tacos" stroke="#ef4444" strokeWidth={2} dot={false} name="TACoS %"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Brand Scorecards */}
      <div style={{background:"var(--bg-card)",borderRadius:20,padding:24,border:"1px solid var(--border-subtle)",boxShadow:"var(--shadow-sm)"}}>
        <div style={{fontSize:14,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:1,fontFamily:"var(--font-body)",marginBottom:20}}>Brand Scorecards — {latest.period}</div>
        <div style={{overflowX:"auto",borderRadius:12}}>
          <table className="data-table" style={{minWidth:1100}}>
          <thead>
            <tr style={{borderBottom:"2px solid #1e293b"}}>
              {["Brand","Health","Revenue","Units","Gross Profit","Margin","TACoS","ACoS","Organic %","Rev/Unit","COGS %","Fee %"].map(h=>(
                <th key={h} style={{padding:"10px 12px",textAlign:"right",color:"#64748b",fontWeight:600,fontSize:11,textTransform:"uppercase",letterSpacing:.5}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {latest.brands.map(b => {
              const healthColor = b.healthScore >= 70 ? "#10b981" : b.healthScore >= 40 ? "#f59e0b" : "#f43f5e";
              const healthBg = b.healthScore >= 70 ? "rgba(16,185,129,0.15)" : b.healthScore >= 40 ? "rgba(245,158,11,0.15)" : "rgba(244,63,94,0.15)";
              return (
              <tr key={b.b} style={{borderBottom:"1px solid #1e293b"}}>
                <td style={{padding:"10px 12px",fontWeight:700,color:BRAND_COLORS[b.b]||"#e2e8f0",textAlign:"left"}}><span style={{display:"inline-block",width:8,height:8,borderRadius:2,background:BRAND_COLORS[b.b]||"#64748b",marginRight:8}}></span>{b.b}</td>
                <td style={{padding:"10px 12px",textAlign:"right"}}><span style={{padding:"4px 10px",borderRadius:12,fontSize:12,fontWeight:700,background:healthBg,color:healthColor,fontFamily:"var(--font-mono)"}}>{b.healthScore}</span></td>
                <td style={{padding:"10px 12px",textAlign:"right",fontFamily:"monospace",color:"#f1f5f9"}}>{fmtK(b.rev)}</td>
                <td style={{padding:"10px 12px",textAlign:"right",fontFamily:"monospace",color:"#cbd5e1"}}>{fmtNum(b.units)}</td>
                <td style={{padding:"10px 12px",textAlign:"right",fontFamily:"monospace",color:b.gp<0?"#ef4444":"#22c55e",fontWeight:600}}>{fmtK(b.gp)}</td>
                <td style={{padding:"10px 12px",textAlign:"right",fontFamily:"monospace",color:b.gm<0?"#ef4444":b.gm<.05?"#f59e0b":"#22c55e",fontWeight:700}}>{fmtPct(b.gm)}</td>
                <td style={{padding:"10px 12px",textAlign:"right",fontFamily:"monospace",color:b.tacos>.20?"#ef4444":b.tacos>.15?"#f59e0b":"#22c55e"}}>{fmtPct(b.tacos)}</td>
                <td style={{padding:"10px 12px",textAlign:"right",fontFamily:"monospace",color:"#cbd5e1"}}>{fmtPct(b.acos)}</td>
                <td style={{padding:"10px 12px",textAlign:"right",fontFamily:"monospace",color:b.organicRevPct<.30?"#ef4444":b.organicRevPct<.50?"#f59e0b":"#22c55e"}}>{fmtPct(b.organicRevPct)}</td>
                <td style={{padding:"10px 12px",textAlign:"right",fontFamily:"monospace",color:"#cbd5e1"}}>{fmt(b.revPerUnit)}</td>
                <td style={{padding:"10px 12px",textAlign:"right",fontFamily:"monospace",color:"#94a3b8"}}>{fmtPct(b.cogsRate)}</td>
                <td style={{padding:"10px 12px",textAlign:"right",fontFamily:"monospace",color:"#94a3b8"}}>{fmtPct(b.feeRate)}</td>
              </tr>
            )})}
            <tr style={{borderTop:"2px solid #334155",fontWeight:700}}>
              <td style={{padding:"10px 12px",color:"#f1f5f9"}}>TOTAL</td>
              <td style={{padding:"10px 12px"}}></td>
              <td style={{padding:"10px 12px",textAlign:"right",fontFamily:"monospace",color:"#f1f5f9"}}>{fmtK(latest.totalRev)}</td>
              <td style={{padding:"10px 12px",textAlign:"right",fontFamily:"monospace",color:"#f1f5f9"}}>{fmtNum(latest.totalUnits)}</td>
              <td style={{padding:"10px 12px",textAlign:"right",fontFamily:"monospace",color:"#22c55e"}}>{fmtK(latest.totalGP)}</td>
              <td style={{padding:"10px 12px",textAlign:"right",fontFamily:"monospace",color:"#22c55e"}}>{fmtPct(latest.margin)}</td>
              <td style={{padding:"10px 12px",textAlign:"right",fontFamily:"monospace"}}>{fmtPct(latest.tacos)}</td>
              <td colSpan={5}></td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

// ── P&L WATERFALL ──────────────────────────────────────────────────────────
function Waterfall() {
  const [selMonth, setSelMonth] = useState(DATA.length-1);
  const m = DATA[selMonth];
  
  // Build waterfall steps for the portfolio
  const totalAdSpend = m.brands.reduce((s,b)=>s+b.totalAd,0);
  const totalRefFee = m.brands.reduce((s,b)=>s+(b.refFee||0),0);
  const totalFBA = m.brands.reduce((s,b)=>s+(b.fba||0),0);
  const totalStorage = m.brands.reduce((s,b)=>s+(b.storage||0)+(b.lts||0),0);
  const totalLogistics = m.brands.reduce((s,b)=>s+(b.carrier||0)+(b.inbound||0),0);
  const totalOther = m.brands.reduce((s,b)=>s+(b.retFee||0)+(b.disposal||0)+(b.retProc||0)+(b.lowInv||0)+(b.deal||0)+(b.sub||0),0);
  const totalAdj = m.brands.reduce((s,b)=>s-(b.adj||0),0);

  const steps = [
    {name:"Revenue",value:m.totalRev,type:"total"},
    {name:"COGS",value:-m.totalCost,type:"cost"},
    {name:"Referral Fee",value:-totalRefFee,type:"cost"},
    {name:"FBA Fees",value:-totalFBA,type:"cost"},
    {name:"Ad Spend",value:-totalAdSpend,type:"cost"},
    {name:"Storage",value:-totalStorage,type:"cost"},
    {name:"Logistics",value:-totalLogistics,type:"cost"},
    {name:"Other Fees",value:-totalOther,type:"cost"},
    {name:"Adjustments",value:totalAdj,type:totalAdj>=0?"gain":"cost"},
    {name:"Gross Profit",value:m.totalGP,type:"result"}
  ];

  // For waterfall chart - compute cumulative
  let running = 0;
  const waterfallData = steps.map(s => {
    if(s.type==="total"||s.type==="result") {
      const d = {name:s.name,start:0,end:s.value,value:s.value,type:s.type};
      running = s.value;
      return d;
    }
    const start = running;
    running += s.value;
    return {name:s.name,start:Math.min(start,running),end:Math.max(start,running),value:s.value,type:s.type,bottom:Math.min(start,running)};
  });

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:700,color:"#94a3b8"}}>PERIOD:</div>
        <select value={selMonth} onChange={e=>setSelMonth(Number(e.target.value))} style={{background:"#1e293b",color:"#f1f5f9",border:"1px solid #334155",borderRadius:8,padding:"8px 12px",fontSize:13,cursor:"pointer"}}>
          {DATA.map((d,i)=><option key={i} value={i}>{d.period}</option>)}
        </select>
      </div>

      {/* Waterfall Bars */}
      <div style={{background:"#0f172a",borderRadius:12,padding:20,border:"1px solid #1e293b",marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:700,color:"#94a3b8",marginBottom:16}}>P&L WATERFALL — {m.period}</div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={waterfallData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
            <XAxis dataKey="name" tick={{fontSize:10,fill:"#94a3b8"}} interval={0} angle={-25} textAnchor="end" height={60}/>
            <YAxis tick={{fontSize:10,fill:"#64748b"}} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`}/>
            <Tooltip content={<CTooltip/>}/>
            <Bar dataKey="bottom" stackId="a" fill="transparent" />
            <Bar dataKey="value" stackId="a" radius={[3,3,0,0]}>
              {waterfallData.map((d,i)=>(
                <Cell key={i} fill={d.type==="total"?"#3b82f6":d.type==="result"?(d.value>=0?"#22c55e":"#ef4444"):d.type==="gain"?"#22c55e":"#ef4444"}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Brand-Level P&L Table */}
      <div style={{fontSize:13,fontWeight:700,color:"#94a3b8",marginBottom:12}}>BRAND P&L BREAKDOWN — {m.period}</div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead>
            <tr style={{borderBottom:"2px solid #1e293b"}}>
              {["Brand","Revenue","COGS","% Rev","Ref Fee","FBA","Ad Spend","Storage+LTS","Logistics","Other","GP","Margin"].map(h=>(
                <th key={h} style={{padding:"8px 10px",textAlign:"right",color:"#64748b",fontWeight:600,fontSize:10,textTransform:"uppercase"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {m.brands.map(b=>{
              const stor = (b.storage||0)+(b.lts||0);
              const logi = (b.carrier||0)+(b.inbound||0);
              const other = (b.retFee||0)+(b.disposal||0)+(b.retProc||0)+(b.lowInv||0)+(b.deal||0)+(b.sub||0);
              return (
                <tr key={b.b} style={{borderBottom:"1px solid #1e293b"}}>
                  <td style={{padding:"8px 10px",fontWeight:600,color:BRAND_COLORS[b.b]||"#e2e8f0",textAlign:"left"}}>{b.b}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"monospace"}}>{fmtK(b.rev)}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"monospace",color:"#f87171"}}>{fmtK(b.cost)}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"monospace",color:"#94a3b8",fontSize:10}}>{fmtPct(b.cogsRate)}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"monospace",color:"#f87171"}}>{fmtK(b.refFee)}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"monospace",color:"#f87171"}}>{fmtK(b.fba)}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"monospace",color:"#f87171"}}>{fmtK(b.totalAd)}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"monospace",color:stor>b.rev*.03?"#ef4444":"#f87171"}}>{fmtK(stor)}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"monospace",color:"#f87171"}}>{fmtK(logi)}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"monospace",color:"#f87171"}}>{fmtK(other)}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"monospace",fontWeight:700,color:b.gp<0?"#ef4444":"#22c55e"}}>{fmtK(b.gp)}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"monospace",fontWeight:700,color:b.gm<0?"#ef4444":b.gm<.05?"#f59e0b":"#22c55e"}}>{fmtPct(b.gm)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── BRAND DEEP DIVE ────────────────────────────────────────────────────────
function BrandDeepDive() {
  const allBrands = [...new Set(DATA.flatMap(d=>d.brands.map(b=>b.b)))];
  const [selBrand, setSelBrand] = useState("Fomin");

  const brandTrend = DATA.map(d => {
    const b = d.brands.find(x=>x.b===selBrand);
    if(!b) return null;
    return { period:d.period, revenue:b.rev, profit:b.gp, margin:b.gm*100, tacos:b.tacos*100, units:b.units, revPerUnit:b.revPerUnit, profitPerUnit:b.profitPerUnit, organicPct:b.organicRevPct*100, adSpend:b.totalAd, storage:(b.storage||0)+(b.lts||0), fba:b.fba||0 };
  }).filter(Boolean);

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {allBrands.map(b=>(
          <button key={b} onClick={()=>setSelBrand(b)} style={{padding:"8px 16px",borderRadius:8,border:"none",fontSize:12,fontWeight:600,cursor:"pointer",background:selBrand===b?(BRAND_COLORS[b]||"#3b82f6"):"#1e293b",color:selBrand===b?"#fff":"#94a3b8",transition:"all 0.2s"}}>{b}</button>
        ))}
      </div>

      <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:20}}>
        <div style={{flex:1,minWidth:400,background:"#0f172a",borderRadius:12,padding:20,border:"1px solid #1e293b"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#94a3b8",marginBottom:12}}>REVENUE & PROFIT</div>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={brandTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
              <XAxis dataKey="period" tick={{fontSize:9,fill:"#64748b"}} interval={2}/>
              <YAxis tick={{fontSize:10,fill:"#64748b"}} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`}/>
              <Tooltip content={<CTooltip/>}/>
              <Area dataKey="revenue" fill={`${BRAND_COLORS[selBrand]||"#3b82f6"}22`} stroke={BRAND_COLORS[selBrand]||"#3b82f6"} strokeWidth={2} name="Revenue"/>
              <Bar dataKey="profit" fill="#22c55e" radius={[2,2,0,0]} name="Profit" barSize={14}/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div style={{flex:1,minWidth:350,background:"#0f172a",borderRadius:12,padding:20,border:"1px solid #1e293b"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#94a3b8",marginBottom:12}}>MARGIN vs TACoS vs ORGANIC %</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={brandTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
              <XAxis dataKey="period" tick={{fontSize:9,fill:"#64748b"}} interval={2}/>
              <YAxis tick={{fontSize:10,fill:"#64748b"}} tickFormatter={v=>`${v}%`}/>
              <Tooltip content={<CTooltip formatter={v=>`${v.toFixed(1)}%`}/>}/>
              <Line dataKey="margin" stroke="#22c55e" strokeWidth={2} dot={false} name="Margin %"/>
              <Line dataKey="tacos" stroke="#ef4444" strokeWidth={2} dot={false} name="TACoS %"/>
              <Line dataKey="organicPct" stroke="#3b82f6" strokeWidth={2} dot={false} name="Organic %"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:350,background:"#0f172a",borderRadius:12,padding:20,border:"1px solid #1e293b"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#94a3b8",marginBottom:12}}>UNIT ECONOMICS</div>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={brandTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
              <XAxis dataKey="period" tick={{fontSize:9,fill:"#64748b"}} interval={2}/>
              <YAxis tick={{fontSize:10,fill:"#64748b"}} tickFormatter={v=>`$${v.toFixed(0)}`}/>
              <Tooltip content={<CTooltip formatter={v=>`$${v.toFixed(2)}`}/>}/>
              <Bar dataKey="revPerUnit" fill="#3b82f6" radius={[2,2,0,0]} name="Rev/Unit" barSize={12}/>
              <Line dataKey="profitPerUnit" stroke="#22c55e" strokeWidth={2} dot={false} name="Profit/Unit"/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div style={{flex:1,minWidth:350,background:"#0f172a",borderRadius:12,padding:20,border:"1px solid #1e293b"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#94a3b8",marginBottom:12}}>AD SPEND vs STORAGE COSTS</div>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={brandTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
              <XAxis dataKey="period" tick={{fontSize:9,fill:"#64748b"}} interval={2}/>
              <YAxis tick={{fontSize:10,fill:"#64748b"}} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`}/>
              <Tooltip content={<CTooltip/>}/>
              <Bar dataKey="adSpend" fill="#ef4444" radius={[2,2,0,0]} name="Ad Spend" barSize={12}/>
              <Bar dataKey="storage" fill="#f59e0b" radius={[2,2,0,0]} name="Storage+LTS" barSize={12}/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── ADVERTISING INTEL ──────────────────────────────────────────────────────
function AdvertisingIntel() {
  const adData = DATA.map(d => {
    const totSP = d.brands.reduce((s,b)=>s+(b.sp||0),0);
    const totSB = d.brands.reduce((s,b)=>s+(b.sb||0),0);
    const totSD = d.brands.reduce((s,b)=>s+(b.sd||0),0);
    const totSPsales = d.brands.reduce((s,b)=>s+(b.spSales||0),0);
    const totSBsales = d.brands.reduce((s,b)=>s+(b.sbSales||0),0);
    const totSDsales = d.brands.reduce((s,b)=>s+(b.sdSales||0),0);
    const totalAd = totSP+totSB+totSD;
    const totalAdSales = totSPsales+totSBsales+totSDsales;
    return {
      period: d.period,
      sp: totSP, sb: totSB, sd: totSD,
      spSales: totSPsales, sbSales: totSBsales, sdSales: totSDsales,
      totalAd, totalAdSales,
      spAcos: totSPsales ? totSP/totSPsales*100 : 0,
      sbAcos: totSBsales ? totSB/totSBsales*100 : 0,
      sdAcos: totSDsales ? totSD/totSDsales*100 : 0,
      blendedAcos: totalAdSales ? totalAd/totalAdSales*100 : 0,
      tacos: d.totalRev ? totalAd/d.totalRev*100 : 0,
      adSalesRatio: d.totalRev ? totalAdSales/d.totalRev*100 : 0,
      organicPct: d.totalRev ? (1 - Math.min(totalAdSales/d.totalRev,1))*100 : 0,
      roas: totalAd ? totalAdSales/totalAd : 0,
      spPct: totalAd ? totSP/totalAd*100 : 0,
      sbPct: totalAd ? totSB/totalAd*100 : 0,
      sdPct: totalAd ? totSD/totalAd*100 : 0,
    };
  });

  const latest = adData[adData.length-1];

  return (
    <div>
      {/* MCP Philosophy Banner */}
      <div style={{background:"linear-gradient(135deg,#0f172a,#1e1b4b)",borderRadius:12,padding:20,border:"1px solid #312e81",marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:700,color:"#818cf8",marginBottom:8}}>📊 ADVERTISING MCP PHILOSOPHY</div>
        <div style={{fontSize:12,color:"#94a3b8",lineHeight:1.6}}>
          Structured campaign architecture → Data-driven bid management → Continuous keyword harvesting. 
          SP drives 75%+ of spend (exact match & phrase discovery). SB for brand awareness. SD for retargeting & display. 
          Healthy portfolio: TACoS declining while revenue grows. Blended ACoS decreasing. Organic revenue share increasing.
        </div>
      </div>

      {/* Ad Spend by Type */}
      <div style={{display:"flex",gap:16,marginBottom:20,flexWrap:"wrap"}}>
        <div style={{flex:2,minWidth:400,background:"#0f172a",borderRadius:12,padding:20,border:"1px solid #1e293b"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#94a3b8",marginBottom:12}}>AD SPEND BY CAMPAIGN TYPE</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={adData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
              <XAxis dataKey="period" tick={{fontSize:9,fill:"#64748b"}} interval={2}/>
              <YAxis tick={{fontSize:10,fill:"#64748b"}} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`}/>
              <Tooltip content={<CTooltip/>}/>
              <Bar dataKey="sp" stackId="a" fill="#3b82f6" name="SP (Sponsored Products)" radius={[0,0,0,0]}/>
              <Bar dataKey="sb" stackId="a" fill="#8b5cf6" name="SB (Sponsored Brands)"/>
              <Bar dataKey="sd" stackId="a" fill="#14b8a6" name="SD (Sponsored Display)" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{flex:1,minWidth:250,background:"#0f172a",borderRadius:12,padding:20,border:"1px solid #1e293b"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#94a3b8",marginBottom:12}}>SPEND MIX — {latest.period}</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={[{name:"SP",value:latest.sp},{name:"SB",value:latest.sb},{name:"SD",value:latest.sd}]} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                <Cell fill="#3b82f6"/><Cell fill="#8b5cf6"/><Cell fill="#14b8a6"/>
              </Pie>
              <Tooltip formatter={v=>fmt(v)}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ACoS by Type + TACoS */}
      <div style={{display:"flex",gap:16,marginBottom:20,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:400,background:"#0f172a",borderRadius:12,padding:20,border:"1px solid #1e293b"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#94a3b8",marginBottom:12}}>ACoS BY CAMPAIGN TYPE + TACoS</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={adData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
              <XAxis dataKey="period" tick={{fontSize:9,fill:"#64748b"}} interval={2}/>
              <YAxis tick={{fontSize:10,fill:"#64748b"}} tickFormatter={v=>`${v}%`}/>
              <Tooltip content={<CTooltip formatter={v=>`${v.toFixed(1)}%`}/>}/>
              <Line dataKey="spAcos" stroke="#3b82f6" strokeWidth={2} dot={false} name="SP ACoS"/>
              <Line dataKey="sbAcos" stroke="#8b5cf6" strokeWidth={2} dot={false} name="SB ACoS"/>
              <Line dataKey="tacos" stroke="#ef4444" strokeWidth={2.5} dot={false} name="TACoS" strokeDasharray="5 5"/>
              <Line dataKey="blendedAcos" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Blended ACoS"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{flex:1,minWidth:350,background:"#0f172a",borderRadius:12,padding:20,border:"1px solid #1e293b"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#94a3b8",marginBottom:12}}>ORGANIC vs PAID REVENUE %</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={adData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
              <XAxis dataKey="period" tick={{fontSize:9,fill:"#64748b"}} interval={2}/>
              <YAxis tick={{fontSize:10,fill:"#64748b"}} tickFormatter={v=>`${v}%`} domain={[0,100]}/>
              <Tooltip content={<CTooltip formatter={v=>`${v.toFixed(1)}%`}/>}/>
              <Bar dataKey="organicPct" stackId="a" fill="#22c55e" name="Organic %" radius={[0,0,0,0]}/>
              <Bar dataKey="adSalesRatio" stackId="a" fill="#ef4444" name="Paid %" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROAS trend */}
      <div style={{background:"#0f172a",borderRadius:12,padding:20,border:"1px solid #1e293b"}}>
        <div style={{fontSize:13,fontWeight:700,color:"#94a3b8",marginBottom:12}}>ROAS TREND (Return on Ad Spend)</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={adData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
            <XAxis dataKey="period" tick={{fontSize:9,fill:"#64748b"}} interval={2}/>
            <YAxis tick={{fontSize:10,fill:"#64748b"}} tickFormatter={v=>`${v.toFixed(1)}x`}/>
            <Tooltip content={<CTooltip formatter={v=>`${v.toFixed(2)}x`}/>}/>
            <Line dataKey="roas" stroke="#22c55e" strokeWidth={2.5} dot={{r:3,fill:"#22c55e"}} name="ROAS"/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── FEE FORENSICS ─────────────────────────────────────────────────────────
function FeeForensics() {
  const feeData = DATA.map(d => {
    const cogs = d.totalCost;
    const ref = d.brands.reduce((s,b)=>s+(b.refFee||0),0);
    const fba = d.brands.reduce((s,b)=>s+(b.fba||0),0);
    const stor = d.brands.reduce((s,b)=>s+(b.storage||0),0);
    const lts = d.brands.reduce((s,b)=>s+(b.lts||0),0);
    const logistics = d.brands.reduce((s,b)=>s+(b.carrier||0)+(b.inbound||0),0);
    const ads = d.totalAd;
    return {
      period: d.period, revenue: d.totalRev,
      cogsPct: d.totalRev?cogs/d.totalRev*100:0,
      refPct: d.totalRev?ref/d.totalRev*100:0,
      fbaPct: d.totalRev?fba/d.totalRev*100:0,
      storPct: d.totalRev?stor/d.totalRev*100:0,
      ltsPct: d.totalRev?lts/d.totalRev*100:0,
      logPct: d.totalRev?logistics/d.totalRev*100:0,
      adsPct: d.totalRev?ads/d.totalRev*100:0,
      cogs, ref, fba, stor, lts, logistics, ads
    };
  });

  return (
    <div>
      <div style={{background:"#0f172a",borderRadius:12,padding:20,border:"1px solid #1e293b",marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:700,color:"#94a3b8",marginBottom:12}}>COST AS % OF REVENUE — WHERE THE MONEY GOES</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={feeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
            <XAxis dataKey="period" tick={{fontSize:9,fill:"#64748b"}} interval={1}/>
            <YAxis tick={{fontSize:10,fill:"#64748b"}} tickFormatter={v=>`${v}%`}/>
            <Tooltip content={<CTooltip formatter={v=>`${v.toFixed(1)}%`}/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Bar dataKey="cogsPct" stackId="a" fill="#64748b" name="COGS"/>
            <Bar dataKey="refPct" stackId="a" fill="#f59e0b" name="Referral Fee"/>
            <Bar dataKey="fbaPct" stackId="a" fill="#ef4444" name="FBA"/>
            <Bar dataKey="adsPct" stackId="a" fill="#8b5cf6" name="Ads"/>
            <Bar dataKey="storPct" stackId="a" fill="#f97316" name="Storage"/>
            <Bar dataKey="ltsPct" stackId="a" fill="#ec4899" name="Long-term Storage"/>
            <Bar dataKey="logPct" stackId="a" fill="#06b6d4" name="Logistics" radius={[2,2,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Storage cost deep dive - it's been spiking */}
      <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:400,background:"#0f172a",borderRadius:12,padding:20,border:"1px solid #1e293b"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#94a3b8",marginBottom:4}}>🚨 STORAGE COST ESCALATION</div>
          <div style={{fontSize:11,color:"#64748b",marginBottom:12}}>Storage + LTS fees have become a major margin drag — tracking by brand</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={DATA.map(d=>({
              period:d.period,
              ...Object.fromEntries(d.brands.map(b=>[b.b,(b.storage||0)+(b.lts||0)]))
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
              <XAxis dataKey="period" tick={{fontSize:9,fill:"#64748b"}} interval={2}/>
              <YAxis tick={{fontSize:10,fill:"#64748b"}} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`}/>
              <Tooltip content={<CTooltip/>}/>
              {Object.keys(BRAND_COLORS).map(b=><Bar key={b} dataKey={b} stackId="a" fill={BRAND_COLORS[b]}/>)}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{flex:1,minWidth:350,background:"#0f172a",borderRadius:12,padding:20,border:"1px solid #1e293b"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#94a3b8",marginBottom:12}}>FBA FEE RATIO BY BRAND (Latest)</div>
          {DATA[DATA.length-1].brands.map(b=>{
            const fbaRate = b.rev ? (b.fba||0)/b.rev : 0;
            return (
              <div key={b.b} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                  <span style={{color:BRAND_COLORS[b.b]||"#e2e8f0",fontWeight:600}}>{b.b}</span>
                  <span style={{fontFamily:"monospace",color:fbaRate>.35?"#ef4444":fbaRate>.28?"#f59e0b":"#22c55e"}}>{fmtPct(fbaRate)}</span>
                </div>
                <div style={{height:8,background:"#1e293b",borderRadius:4,overflow:"hidden"}}>
                  <div style={{width:`${Math.min(fbaRate*100/.5*100,100)}%`,height:"100%",background:fbaRate>.35?"#ef4444":fbaRate>.28?"#f59e0b":"#22c55e",borderRadius:4,transition:"width 0.5s"}}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── GAPS & RECOMMENDATIONS ────────────────────────────────────────────────
function GapsReco() {
  const issues = [
    {cat:"MISSING METRICS",items:[
      "TACoS not calculated in current spreadsheet — added here as primary health metric",
      "No unit economics (Revenue/Unit, Profit/Unit) — now tracked per brand per month",
      "No organic vs paid revenue split — critical for understanding flywheel health",
      "No MoM or YoY growth rate calculations — added trend analysis",
      "No consolidated total ad spend column — SP+SB+SD was never summed",
      "No fee-as-%-of-revenue breakdown — key for identifying margin compression sources"
    ]},
    {cat:"DATA QUALITY ISSUES",items:[
      "Formula errors (#NAME?, #DIV/0!) present in multiple cells — needs cleanup",
      "Date format inconsistent between 2024 (MM/DD/YYYYMM/DD/YYYY) and 2025 (MM/DD/YYYY/MM/DD/YYYY)",
      "Refund rate shows 0.0016 for HoP Nov-24 (0.16%) but actual returns were 1,222 on 11,627 units (10.5%)",
      "Some adjustment values appear positive when they should reduce costs (sign convention unclear)",
      "Col AF 'Financial cost differences' has #NAME? errors throughout"
    ]},
    {cat:"STRUCTURAL GAPS",items:[
      "Etsy P&L on separate sheet but never consolidated with Amazon — multi-channel view missing",
      "Financial Summary sheet (Sheet 3) only covers Apr-May 2024 — abandoned and outdated",
      "No budget/target column to measure performance against plan",
      "No YTD running totals",
      "No trailing 3-month or 6-month averages for smoothing seasonality",
      "Custom Products & Rockport Tools disappeared after Dec-24 with no notes",
      "House of Party MISSING entirely from Nov-Dec 2025 — but was tracking at -0.2% margin in Oct-25"
    ]},
    {cat:"CRITICAL BUSINESS ALERTS FROM DATA",items:[
      "House of Party margin collapsed from 16.5% (Aug-24) to -0.2% (Oct-25) then vanished — storage fees ($3.4K-$9.9K/mo) and LTS ($1.9K-$8K/mo) are the primary cause",
      "Roofus Pet running at -22% to -30% margin — ad spend ($4.2K-$4.4K/mo) on $5.6K-$10K revenue is unsustainable",  
      "Soul Mama/Luna running at -12% to -14% margin — SP ACoS at 46-52% indicates launch phase but needs guardrails",
      "Fomin Nov-25 margin dropped to 13.1% from 20%+ average — storage fees spiked to $7.4K (3.2% of revenue vs normal 0.5%)",
      "Portfolio TACoS spikes to 17-19% in low-revenue months (Nov) — ad spend doesn't scale down with revenue",
      "Functions Labs Jun-25 margin crashed to 2.4% — needs investigation"
    ]},
    {cat:"RECOMMENDED ENHANCEMENTS FOR V2",items:[
      "Add SKU-level P&L (currently brand-level only) — 80/20 rule means 20% of SKUs drive profits",
      "Add inventory days-of-supply calculation using units sold velocity",
      "Add keyword rank tracking tier (Datarova integration) as leading indicator",
      "Add conversion rate per brand (sessions → orders from Amazon Business Reports)",
      "Add review rating & count tracking",
      "Add BSR trending per top ASIN",
      "Add team member accountability column (who owns each brand)",
      "Automate LingXing → Google Sheets → Dashboard pipeline with daily refresh"
    ]}
  ];

  return (
    <div>
      <div style={{fontSize:14,fontWeight:700,color:"#f1f5f9",marginBottom:4}}>P&L AUDIT & ENHANCEMENT ROADMAP</div>
      <div style={{fontSize:12,color:"#64748b",marginBottom:20}}>Analysis of current spreadsheet gaps, data quality issues, and recommended improvements</div>
      {issues.map(g=>(
        <div key={g.cat} style={{background:"#0f172a",borderRadius:12,padding:20,border:"1px solid #1e293b",marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:g.cat.includes("ALERT")?"#ef4444":g.cat.includes("MISSING")?"#f59e0b":g.cat.includes("QUALITY")?"#f97316":g.cat.includes("STRUCTURAL")?"#8b5cf6":"#22c55e",marginBottom:12}}>{g.cat}</div>
          {g.items.map((item,i)=>(
            <div key={i} style={{padding:"8px 0",borderBottom:i<g.items.length-1?"1px solid #1e293b":"none",fontSize:12,color:"#cbd5e1",lineHeight:1.6}}>
              <span style={{color:"#64748b",marginRight:8}}>→</span>{item}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────
export default function Dashboard() {
  const [tab, setTab] = useState(0);
  const latest = DATA[DATA.length-1];

  return (
    <div style={{minHeight:"100vh",background:"var(--bg-primary)",color:"var(--text-primary)",fontFamily:"var(--font-body)"}}>
      {/* Header */}
      <header style={{
        position:"sticky",top:0,zIndex:100,
        background:"rgba(10,14,26,0.85)",
        backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",
        borderBottom:"1px solid var(--border-subtle)"
      }}>
        <div style={{maxWidth:1440,margin:"0 auto",padding:"0 32px"}}>
          {/* Top bar */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 0 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:16}}>
              {/* Logo mark */}
              <div style={{
                width:42,height:42,borderRadius:12,
                background:"linear-gradient(135deg, #10b981 0%, #059669 100%)",
                display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow:"0 0 24px rgba(16,185,129,0.3)"
              }}>
                <span style={{fontSize:18,fontWeight:800,color:"#fff"}}>P</span>
              </div>
              <div>
                <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:3,color:"var(--text-muted)",fontWeight:600,fontFamily:"var(--font-body)"}}>PETRA BRANDS</div>
                <div style={{fontSize:22,fontWeight:700,color:"var(--text-primary)",fontFamily:"var(--font-display)",marginTop:2,letterSpacing:"-0.02em"}}>P&L Command Center</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:24}}>
              {/* Quick stats */}
              <div style={{display:"flex",gap:20}}>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:1,color:"var(--text-dim)",marginBottom:2}}>Revenue</div>
                  <div style={{fontSize:16,fontWeight:700,fontFamily:"var(--font-mono)",color:"var(--text-primary)"}}>${(latest.totalRev/1000).toFixed(0)}K</div>
                </div>
                <div style={{width:1,background:"var(--border-subtle)"}}/>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:1,color:"var(--text-dim)",marginBottom:2}}>Margin</div>
                  <div style={{fontSize:16,fontWeight:700,fontFamily:"var(--font-mono)",color:"var(--accent-emerald)"}}>{(latest.margin*100).toFixed(1)}%</div>
                </div>
              </div>
              {/* Date badge */}
              <div style={{
                padding:"8px 14px",borderRadius:10,
                background:"var(--bg-card)",border:"1px solid var(--border-subtle)"
              }}>
                <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:1,color:"var(--text-dim)"}}>Data Range</div>
                <div style={{fontSize:13,fontWeight:600,color:"var(--text-secondary)",fontFamily:"var(--font-mono)",marginTop:2}}>May '24 — Dec '25</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <nav style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:0,marginLeft:-8}}>
            {TABS.map((t,i)=>(
              <button key={t} onClick={()=>setTab(i)} style={{
                padding:"12px 20px",fontSize:13,fontWeight:600,cursor:"pointer",
                border:"none",borderRadius:"10px 10px 0 0",
                background:tab===i?"var(--bg-card)":"transparent",
                color:tab===i?"var(--text-primary)":"var(--text-muted)",
                transition:"all 0.2s ease",whiteSpace:"nowrap",
                fontFamily:"var(--font-body)",
                borderBottom:tab===i?"2px solid var(--accent-emerald)":"2px solid transparent",
                position:"relative"
              }}>
                {t}
                {tab===i && <div style={{position:"absolute",bottom:-1,left:0,right:0,height:2,background:"var(--accent-emerald)",borderRadius:2}}/>}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main style={{padding:"32px",maxWidth:1440,margin:"0 auto"}}>
        <div className="animate-fade-in" key={tab}>
          {tab===0 && <ExecSummary/>}
          {tab===1 && <Waterfall/>}
          {tab===2 && <BrandDeepDive/>}
          {tab===3 && <AdvertisingIntel/>}
          {tab===4 && <FeeForensics/>}
          {tab===5 && <GapsReco/>}
        </div>
      </main>
    </div>
  );
}
