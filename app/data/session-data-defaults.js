module.exports = {

  // Woodland Management Plan (PA3) caseworking journey, v8 — copied from the
  // Woodlands prototype. Read in views as data['pa3']['v8'].
  pa3: {
    v8: {
      orgs: require('./pa3/v8/organisations.json'),
      users: require('./pa3/v8/users.json'),
      org_applicants: require('./pa3/v8/org_applicants.json'),
      landparcels: require('./pa3/v8/landparcels.json'),
      adminusers: require('./pa3/v8/adminusers.json'),
      applications: require('./pa3/v8/applications.json')
    }
  }

}
