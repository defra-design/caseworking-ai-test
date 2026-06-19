// Data reference file: the full Grasslands caselist case set.
// Read by the Grasslands caselist routes in routes.js (via loadGrassCases()) to
// filter (My / team context / Completed) and paginate, then passed to templates
// through the per-route `view` object.
//
// DATA RULES (enforce when editing):
//  1. status + tag come from the FRPS-D2/caselist set ONLY:
//       Application received -> grey   | In review        -> blue
//       On hold              -> yellow | Agreement drafted -> blue
//       Agreement offered    -> blue   | Agreement accepted-> green
//       Rejected             -> red    | Withdrawn        -> orange
//     (Golden Grange uses status "live"; its tag/text come from the session.)
//  2. sbi is a unique 9-digit string per distinct business.
//  3. submitted date is appropriate to the status (advanced statuses are older).
//  4. team is A/B/C; assignee is one of that team's caseworkers
//     (see data/grasslands-teams.js). Teams are balanced ~equally and by age.
module.exports = {
  cases: [
  { id: "100279", business: "CE FAIRFAX & PARTNERS", sbi: "003849012", submitted: "6 Jan 2025", status: "Agreement accepted", tag: "green", team: "A", assignee: "M Walker" },
  { id: "100280", business: "Eskdale Farm Ltd", sbi: "912849012", submitted: "19 Jan 2025", status: "Agreement accepted", tag: "green", team: "B", assignee: "E Carter" },
  { id: "100281", business: "Ennerdale Farm Ltd", sbi: "712849012", submitted: "1 Feb 2025", status: "Agreement accepted", tag: "green", team: "C", assignee: "A Jones" },
  { id: "100282", business: "Moors Farm Ltd", sbi: "612849012", submitted: "14 Feb 2025", status: "Agreement accepted", tag: "green", team: "A", assignee: "R Singh" },
  { id: "100283", business: "Buttermere Farm Ltd", sbi: "116549012", submitted: "27 Feb 2025", status: "Agreement accepted", tag: "green", team: "B", assignee: "J Jones" },
  { id: "100284", business: "Sunrise Agriculture", sbi: "112865012", submitted: "12 Mar 2025", status: "Agreement accepted", tag: "green", team: "C", assignee: "L Owusu" },
  { id: "100285", business: "GRAHAM & SONS", sbi: "188849012", submitted: "25 Mar 2025", status: "Agreement accepted", tag: "green", team: "A", assignee: "T Okafor" },
  { id: "100286", business: "VW RICHARDS & PARTNERS", sbi: "187849012", submitted: "7 Apr 2025", status: "Agreement accepted", tag: "green", team: "B", assignee: "P Shah" },
  { id: "100287", business: "Golden Grange", sbi: "300000100", submitted: "20 Apr 2025", status: "live", tag: "", team: "C", assignee: "K Reed" },
  { id: "100288", business: "Greater Massingham Farm", sbi: "022849012", submitted: "3 May 2025", status: "Agreement accepted", tag: "green", team: "A", assignee: "M Walker" },
  { id: "100289", business: "Fresh Fields Farm", sbi: "112849019", submitted: "16 May 2025", status: "Agreement accepted", tag: "green", team: "B", assignee: "E Carter" },
  { id: "100290", business: "J F HODGES", sbi: "112849013", submitted: "29 May 2025", status: "Rejected", tag: "red", team: "C", assignee: "A Jones" },
  { id: "100291", business: "Harvest Horizon", sbi: "112846012", submitted: "11 Jun 2025", status: "Rejected", tag: "red", team: "A", assignee: "R Singh" },
  { id: "100292", business: "North Sussex Farm Partnership", sbi: "112850012", submitted: "24 Jun 2025", status: "Withdrawn", tag: "orange", team: "B", assignee: "J Jones" },
  { id: "100293", business: "J RENNER AND SONS", sbi: "012849012", submitted: "7 Jul 2025", status: "Withdrawn", tag: "orange", team: "C", assignee: "L Owusu" },
  { id: "100294", business: "T and F Farms", sbi: "102849012", submitted: "20 Jul 2025", status: "Agreement offered", tag: "blue", team: "A", assignee: "T Okafor" },
  { id: "100295", business: "MESSRS J WICKHAM", sbi: "110049012", submitted: "2 Aug 2025", status: "Agreement offered", tag: "blue", team: "B", assignee: "P Shah" },
  { id: "100296", business: "SF RICHARDS & SONS", sbi: "113849012", submitted: "15 Aug 2025", status: "Agreement offered", tag: "blue", team: "C", assignee: "K Reed" },
  { id: "100297", business: "Berkshire Estate Limited", sbi: "112849012", submitted: "28 Aug 2025", status: "Agreement offered", tag: "blue", team: "A", assignee: "M Walker" },
  { id: "100298", business: "Alton Farms", sbi: "112841023", submitted: "10 Sep 2025", status: "Agreement drafted", tag: "blue", team: "B", assignee: "E Carter" },
  { id: "100299", business: "DAVID ROGER-HOGGS", sbi: "112849000", submitted: "23 Sep 2025", status: "Agreement drafted", tag: "blue", team: "C", assignee: "A Jones" },
  { id: "100300", business: "Berkshire Estate Limited", sbi: "112849012", submitted: "6 Oct 2025", status: "Agreement drafted", tag: "blue", team: "A", assignee: "R Singh" },
  { id: "100310", business: "Berkshire Estate Limited", sbi: "112849012", submitted: "19 Oct 2025", status: "Agreement drafted", tag: "blue", team: "B", assignee: "J Jones" },
  { id: "100311", business: "Wynyard Estate", sbi: "200000311", submitted: "1 Nov 2025", status: "On hold", tag: "yellow", team: "C", assignee: "L Owusu" },
  { id: "100312", business: "Cloverfield Farm", sbi: "200000312", submitted: "14 Nov 2025", status: "On hold", tag: "yellow", team: "A", assignee: "T Okafor" },
  { id: "100313", business: "Highgrove Pastures", sbi: "200000313", submitted: "27 Nov 2025", status: "On hold", tag: "yellow", team: "B", assignee: "P Shah" },
  { id: "100314", business: "Stonebridge Farm", sbi: "200000314", submitted: "10 Dec 2025", status: "On hold", tag: "yellow", team: "C", assignee: "K Reed" },
  { id: "100315", business: "Thornton Holdings", sbi: "200000315", submitted: "23 Dec 2025", status: "In review", tag: "blue", team: "A", assignee: "M Walker" },
  { id: "100316", business: "Marsh View Farm", sbi: "200000316", submitted: "5 Jan 2026", status: "In review", tag: "blue", team: "B", assignee: "E Carter" },
  { id: "100317", business: "Beacon Hill Farm", sbi: "200000317", submitted: "18 Jan 2026", status: "In review", tag: "blue", team: "C", assignee: "A Jones" },
  { id: "100318", business: "Larkrise Agriculture", sbi: "200000318", submitted: "31 Jan 2026", status: "In review", tag: "blue", team: "A", assignee: "R Singh" },
  { id: "100319", business: "Foxglove Farm", sbi: "200000319", submitted: "13 Feb 2026", status: "In review", tag: "blue", team: "B", assignee: "J Jones" },
  { id: "100320", business: "Crowtree Estate", sbi: "200000320", submitted: "26 Feb 2026", status: "In review", tag: "blue", team: "C", assignee: "L Owusu" },
  { id: "100321", business: "Hazelwood Farm", sbi: "200000321", submitted: "11 Mar 2026", status: "In review", tag: "blue", team: "A", assignee: "T Okafor" },
  { id: "100322", business: "Bramblewood Holdings", sbi: "200000322", submitted: "24 Mar 2026", status: "Application received", tag: "grey", team: "B", assignee: "P Shah" },
  { id: "100323", business: "Redholme Farm", sbi: "200000323", submitted: "6 Apr 2026", status: "Application received", tag: "grey", team: "C", assignee: "K Reed" },
  { id: "100324", business: "Pennine Edge Farm", sbi: "200000324", submitted: "19 Apr 2026", status: "Application received", tag: "grey", team: "A", assignee: "M Walker" },
  { id: "100325", business: "Brackenfell Farm", sbi: "200000325", submitted: "1 Jul 2024", status: "Agreement accepted", tag: "green", team: "B", assignee: "E Carter" },
  { id: "100326", business: "Dovecote Holdings", sbi: "200000326", submitted: "23 Jul 2024", status: "Agreement accepted", tag: "green", team: "C", assignee: "A Jones" },
  { id: "100327", business: "Elmwood Estate", sbi: "200000327", submitted: "15 Aug 2024", status: "Agreement accepted", tag: "green", team: "A", assignee: "R Singh" },
  { id: "100328", business: "Fernlea Farm", sbi: "200000328", submitted: "7 Sep 2024", status: "Agreement accepted", tag: "green", team: "B", assignee: "J Jones" },
  { id: "100329", business: "Gorsehill Agriculture", sbi: "200000329", submitted: "30 Sep 2024", status: "Agreement accepted", tag: "green", team: "C", assignee: "L Owusu" },
  { id: "100330", business: "Netherby Estate", sbi: "200000330", submitted: "20 Oct 2024", status: "Rejected", tag: "red", team: "A", assignee: "T Okafor" },
  { id: "100331", business: "Hartwell Farm", sbi: "200000331", submitted: "23 Oct 2024", status: "Agreement accepted", tag: "green", team: "B", assignee: "P Shah" },
  { id: "100332", business: "Ivybridge Holdings", sbi: "200000332", submitted: "15 Nov 2024", status: "Agreement accepted", tag: "green", team: "C", assignee: "K Reed" },
  { id: "100333", business: "Orchard Rise Farm", sbi: "200000333", submitted: "15 Nov 2024", status: "Withdrawn", tag: "orange", team: "A", assignee: "M Walker" },
  { id: "100334", business: "Juniper Fields", sbi: "200000334", submitted: "8 Dec 2024", status: "Agreement accepted", tag: "green", team: "B", assignee: "E Carter" },
  { id: "100335", business: "Kestrel Farm", sbi: "200000335", submitted: "31 Dec 2024", status: "Agreement accepted", tag: "green", team: "C", assignee: "A Jones" },
  { id: "100336", business: "Linden Grange", sbi: "200000336", submitted: "23 Jan 2025", status: "Agreement accepted", tag: "green", team: "A", assignee: "R Singh" },
  { id: "100337", business: "Mossgate Farm", sbi: "200000337", submitted: "15 Feb 2025", status: "Agreement accepted", tag: "green", team: "B", assignee: "J Jones" },
  { id: "100338", business: "Primrose Holdings", sbi: "200000338", submitted: "1 Mar 2025", status: "Agreement offered", tag: "blue", team: "C", assignee: "L Owusu" },
  { id: "100339", business: "Quarrybank Farm", sbi: "200000339", submitted: "5 Apr 2025", status: "Agreement offered", tag: "blue", team: "A", assignee: "T Okafor" },
  { id: "100340", business: "Rookery Farm", sbi: "200000340", submitted: "10 May 2025", status: "Agreement offered", tag: "blue", team: "B", assignee: "P Shah" },
  { id: "100341", business: "Saltmarsh Agriculture", sbi: "200000341", submitted: "15 Jun 2025", status: "Agreement offered", tag: "blue", team: "C", assignee: "K Reed" },
  { id: "100342", business: "Tanglewood Estate", sbi: "200000342", submitted: "20 Jun 2025", status: "Agreement drafted", tag: "blue", team: "A", assignee: "M Walker" },
  { id: "100343", business: "Underhill Farm", sbi: "200000343", submitted: "20 Jul 2025", status: "Agreement drafted", tag: "blue", team: "B", assignee: "E Carter" },
  { id: "100344", business: "Vale End Farm", sbi: "200000344", submitted: "20 Aug 2025", status: "Agreement drafted", tag: "blue", team: "C", assignee: "A Jones" },
  { id: "100345", business: "Westcombe Holdings", sbi: "200000345", submitted: "20 Sep 2025", status: "Agreement drafted", tag: "blue", team: "A", assignee: "R Singh" },
  { id: "100346", business: "Yewtree Farm", sbi: "200000346", submitted: "25 Sep 2025", status: "On hold", tag: "yellow", team: "B", assignee: "J Jones" },
  { id: "100347", business: "Ashdown Estate", sbi: "200000347", submitted: "16 Oct 2025", status: "On hold", tag: "yellow", team: "C", assignee: "L Owusu" },
  { id: "100348", business: "Birchgrove Farm", sbi: "200000348", submitted: "7 Nov 2025", status: "On hold", tag: "yellow", team: "A", assignee: "T Okafor" },
  { id: "100349", business: "Carrside Holdings", sbi: "200000349", submitted: "28 Nov 2025", status: "On hold", tag: "yellow", team: "B", assignee: "P Shah" },
  { id: "100350", business: "Deepdale Farm", sbi: "200000350", submitted: "20 Dec 2025", status: "On hold", tag: "yellow", team: "C", assignee: "K Reed" },
  { id: "100351", business: "Edgeworth Estate", sbi: "200000351", submitted: "25 Dec 2025", status: "In review", tag: "blue", team: "A", assignee: "M Walker" },
  { id: "100352", business: "Foxhollow Farm", sbi: "200000352", submitted: "15 Jan 2026", status: "In review", tag: "blue", team: "B", assignee: "E Carter" },
  { id: "100353", business: "Greenhill Agriculture", sbi: "200000353", submitted: "5 Feb 2026", status: "In review", tag: "blue", team: "C", assignee: "A Jones" },
  { id: "100354", business: "Heronwood Farm", sbi: "200000354", submitted: "26 Feb 2026", status: "In review", tag: "blue", team: "A", assignee: "R Singh" },
  { id: "100355", business: "Inglenook Holdings", sbi: "200000355", submitted: "19 Mar 2026", status: "In review", tag: "blue", team: "B", assignee: "J Jones" },
  { id: "100356", business: "Larchfield Farm", sbi: "200000356", submitted: "10 Apr 2026", status: "In review", tag: "blue", team: "C", assignee: "L Owusu" },
  { id: "100357", business: "Meadowgate Estate", sbi: "200000357", submitted: "20 Apr 2026", status: "Application received", tag: "grey", team: "A", assignee: "T Okafor" },
  { id: "100358", business: "Nightingale Farm", sbi: "200000358", submitted: "15 May 2026", status: "Application received", tag: "grey", team: "B", assignee: "P Shah" },
  { id: "100359", business: "Oakridge Holdings", sbi: "200000359", submitted: "10 Jun 2026", status: "Application received", tag: "grey", team: "C", assignee: "K Reed" },
  { id: "100360", business: "Pendle View Farm", sbi: "200000360", submitted: "19 Jun 2026", status: "Application received", tag: "grey", team: "", assignee: "Not assigned" },
  { id: "100361", business: "Quayside Holdings", sbi: "200000361", submitted: "19 Jun 2026", status: "Application received", tag: "grey", team: "", assignee: "Not assigned" },
  { id: "100362", business: "Ravensworth Estate", sbi: "200000362", submitted: "19 Jun 2026", status: "Application received", tag: "grey", team: "", assignee: "Not assigned" },
  { id: "100363", business: "Sandbeck Farm", sbi: "200000363", submitted: "19 Jun 2026", status: "Application received", tag: "grey", team: "", assignee: "Not assigned" },
  { id: "100364", business: "Thirlmere Holdings", sbi: "200000364", submitted: "19 Jun 2026", status: "Application received", tag: "grey", team: "", assignee: "Not assigned" },
  { id: "100365", business: "Ullswater Farm", sbi: "200000365", submitted: "19 Jun 2026", status: "Application received", tag: "grey", team: "", assignee: "Not assigned" },
  { id: "100366", business: "Wansbeck Farm", sbi: "200000366", submitted: "19 Jun 2026", status: "Application received", tag: "grey", team: "", assignee: "Not assigned" },
  { id: "100367", business: "Yarrow Estate", sbi: "200000367", submitted: "19 Jun 2026", status: "Application received", tag: "grey", team: "", assignee: "Not assigned" },
  { id: "100368", business: "Aldercarr Farm", sbi: "200000368", submitted: "19 Jun 2026", status: "Application received", tag: "grey", team: "", assignee: "Not assigned" },
  { id: "100369", business: "Blencathra Holdings", sbi: "200000369", submitted: "19 Jun 2026", status: "Application received", tag: "grey", team: "", assignee: "Not assigned" },
  { id: "100370", business: "Coldstream Farm", sbi: "200000370", submitted: "19 Jun 2026", status: "Application received", tag: "grey", team: "", assignee: "Not assigned" },
  { id: "100371", business: "Dunkeld Estate", sbi: "200000371", submitted: "19 Jun 2026", status: "Application received", tag: "grey", team: "", assignee: "Not assigned" },
  { id: "100372", business: "Ferndale Agriculture", sbi: "200000372", submitted: "19 Jun 2026", status: "Application received", tag: "grey", team: "", assignee: "Not assigned" }
  ]
}
