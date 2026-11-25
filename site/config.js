/* =========================================================
   ADMIN: everything you update lives in this block.
   Change a value, save, and the website and the staff page both update.
   ========================================================= */
const CONFIG = {
  email: "camps@englandnorthvolleyball.co.uk",
  welfareOfficer: { name: "", contact: "" },   // fill in: name and email of the welfare officer

  // Sign-ups go to the England North Google Form, which saves them to its Google Sheet
  // and emails a copy. Entry IDs come from the live form; add more as questions are added.
  googleForm: {
    action: "https://docs.google.com/forms/d/e/1FAIpQLSdyKgN4VN1FrIT9wiyjYf-KcVfxvCoV6PZ8RjTj190fSLuxog/formResponse",
    email: "emailAddress",
    name: "entry.1985634976",
    mobile: "entry.1221599944",
    dob: "entry.1189691216",          // date question: sent as _year/_month/_day
    parentEmail: "entry.986908028",   // "Parent or Guardian email"
    club: "entry.1937283576",
    position: "entry.571082787",
    programme: "entry.341259679",
    message: "entry.467820305",
    size: "",        // "Shirt size" question: add its entry ID once it's on the Google Form
    printName: ""    // "Name on training top" question: same
  },

  // sortDate = first day, endDate = last day (YYYY-MM-DD). Used for the dates list and Google's event listings.
  programmes: [
    {
      id: "denmark", featured: true, img: "img/denmark.jpg",
      title: "Denmark Easter Camp", flag: "DENMARK",
      when: "24 to 27 Mar 2027", sortDate: "2027-03-24", endDate: "2027-03-27", where: "Ikast, Denmark",
      who: "U18 boys and girls", entry: "Open to applications",
      price: "£550",
      includes: ["Return flight from London", "Transfers in Denmark", "Accommodation", "Food at the camp", "Training", "Coaching", "England North training t-shirts"],
      placesLeft: 30, placesTotal: 0, // set placesTotal to show the progress bar
      status: "Applications open",
      blurb: "Train and compete in Denmark over Easter with our partners at Volleyball Danmark. Our biggest trip of the year."
    },
    {
      id: "lanzarote",
      title: "Lanzarote Beach Camp", flag: "LANZAROTE",
      when: "13 to 20 Feb 2027", sortDate: "2027-02-13", endDate: "2027-02-20", where: "Lanzarote, Spain",
      who: "Indoor and beach players", entry: "Open",
      price: "£1,200", status: "Limited places",
      includes: ["Flight", "Transfers", "Accommodation", "Food", "Coaching", "Beach vests", "England North towel"],
      blurb: "A week of beach volleyball training in the sun over February half-term. Sharper footwork, better reads, better indoor game."
    },
    {
      id: "belgium", askSize: false, img: "img/waremme-hall.jpg",
      title: "Belgium Summer Tour", flag: "BELGIUM",
      when: "20 to 23 Aug 2027", sortDate: "2027-08-20", endDate: "2027-08-23", where: "Waremme, Belgium",
      who: "U22 men's squad", entry: "Selected at trials",
      price: "Confirmed by January 2027", status: "Dates confirmed",
      includes: ["England North match shirt", "Training kit"],
      blurb: "Our fourth year touring Waremme. Training, matches against Belgian club opposition and a pro league game.",
      cta: "Register for trials", pickTitle: "England North Trials"
    },
    {
      id: "belgium-girls", askSize: false, img: "img/girls-tour.jpg",
      title: "Belgium Girls Summer Tour", flag: "BELGIUM",
      when: "20 to 23 Aug 2027", sortDate: "2027-08-20", endDate: "2027-08-23", where: "Waremme, Belgium",
      who: "Under-18 girls", entry: "Selected at girls trials",
      price: "To be confirmed", status: "Dates confirmed",
      includes: ["England North match shirt", "Training kit"],
      blurb: "England North girls are heading to Waremme. Training, matches against Belgian club opposition and the full touring experience.",
      cta: "Register for trials", pickTitle: "England North Girls Trials"
    },
    {
      id: "trials", img: "img/trials.jpg",
      title: "England North Trials", flag: "TRIALS",
      when: "Date to be confirmed", sortDate: "", where: "Venue to be confirmed",
      who: "U22 men", entry: "Open to all",
      price: "£25 per player", status: "Register now",
      includes: ["Personalised training top"],
      blurb: "Trials for the Waremme summer tour squad. Register now and we'll send you the date and venue as soon as they're confirmed.",
      cta: "Register for trials"
    },
    {
      id: "girls-trials", img: "img/girls-trials.jpg",
      title: "England North Girls Trials", flag: "GIRLS TRIALS",
      when: "January 2027, date to be confirmed", sortDate: "2027-01-01", where: "Venue to be confirmed",
      who: "Under-18 girls", entry: "Open to all",
      price: "£25 per player", status: "Register your interest",
      includes: ["Personalised training top"],
      blurb: "Trials for the girls' Waremme summer tour squad. Register now and we'll send you the date and venue as soon as they're confirmed.",
      cta: "Register for trials"
    },
    {
      id: "raf", img: "img/raf-camp.jpg",
      title: "Over-18s Summer Camp", flag: "RAF CAMP",
      when: "24 to 28 Jul 2027", sortDate: "2027-07-24", endDate: "2027-07-28", where: "RAF Cranwell, Lincolnshire",
      who: "Players aged 18 and over", entry: "Open",
      price: "£400", status: "Dates confirmed",
      includes: ["Training kit", "Meals", "Coaching", "Accommodation"],
      blurb: "A summer camp run with the RAF for players aged 18 and over. High standards, high-quality coaching, real progress."
    }
  ],

  // Staff availability page (/staff/): Google Apps Script web app address that saves answers to the Sheet
  staffSheet: "",

  // Trips and events staff need to plan for that aren't on the public site yet.
  // Same fields as programmes. When one goes public, move it up into programmes.
  staffOnly: [
    {
      id: "mallorca", title: "Mallorca Spring Camp",
      when: "2 to 9 Apr 2027", sortDate: "2027-04-02", endDate: "2027-04-09", where: "Mallorca, Spain"
    }
  ],

  // Extra dates that aren't programmes (trials, deadlines, info evenings)
  extraDates: [
    // { date:"2027-01-15", title:"Denmark balance due", note:"Final payment for Easter camp" }
  ]
};
/* ========================================================= */
