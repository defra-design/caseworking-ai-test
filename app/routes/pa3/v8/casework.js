var v = "v8";

function matchref(req){
  // find matching ref in session data
  objIndex = req.session.data['pa3'][v]['applications'].findIndex(obj => obj.ref === req.params.ref);
  // store selected ref in a session variable
  let ref = req.params.ref;
  return ref;
}

// Session answers for the FC review Decision (Reject / Withdraw / Progress to claim
// stage). Cleared once used so they don't leak from one case to another.
function clearDecisionAnswers(req){
  delete req.session.data['fc-decision'];
  delete req.session.data['fc-decision-notes-reject'];
  delete req.session.data['fc-decision-notes-withdraw'];
  delete req.session.data['fc-decision-notes-progress'];
}

module.exports = function(router) {

  /**************
   * CW Sign In *
   **************/

    router.post("/pa3/" + v + "/casework/sign-in", function (req, res) {
      const adminusers = req.session.data["pa3"][v]["adminusers"] || [];
      const adminemail = String(req.session.data["pa3"][v]["casework"]["signin-email"] || "").trim();

      let matchedUser = adminusers.find(u => String(u.email).trim() === adminemail);

      if (!matchedUser) {
        return res.redirect("/pa3/" + v + "/casework/sign-in"); // Email not found
      }

      // Route based on user type
      if (matchedUser.type === "manager") {
        return res.redirect("/pa3/" + v + "/casework/manager/applications");
      } else if (matchedUser.type === "caseworker") {
        return res.redirect("/pa3/" + v + "/casework/caseworker/case-list");
      } else {
        // fallback for unknown user type
        return res.redirect("/pa3/" + v + "/casework/sign-in");
      }
    });

  /*****************
   * CW Navigation *
   *****************/

    // View generate agreement tasks
    router.get("/pa3/" + v + "/casework/caseworker/application/:ref/fc-review", function (req, res) {
      let ref = matchref(req);
      res.render("/pa3/" + v + "/casework/caseworker/application/fc-review", {ref});
    });

    // View FC outcome task list
    router.get("/pa3/" + v + "/casework/caseworker/application/:ref/tasklist-fcoutcome", function (req, res) {
      let ref = matchref(req);
      clearDecisionAnswers(req);
      res.render("/pa3/" + v + "/casework/caseworker/application/tasklist-fcoutcome", {ref, selected: "", notes: {}});
    });

    // View claim task list
    router.get("/pa3/" + v + "/casework/caseworker/application/:ref/tasklist", function (req, res) {
      let ref = matchref(req);
      res.render("/pa3/" + v + "/casework/caseworker/application/tasklist", {ref});
    });

    // Record eligible area
    router.get("/pa3/" + v + "/casework/caseworker/application/:ref/record-area", function (req, res) {
      let ref = matchref(req);
      res.render("/pa3/" + v + "/casework/caseworker/application/record-area", {ref});
    });

    
    // Record eligible area
    router.get("/pa3/" + v + "/casework/caseworker/application/:ref/tell-customer", function (req, res) {
      let ref = matchref(req);
      res.render("/pa3/" + v + "/casework/caseworker/application/tell-customer", {ref});
    });

    
    // Claim task completed screen
    router.get("/pa3/" + v + "/casework/caseworker/application/:ref/waiting-for-claim", function (req, res) {
      let ref = matchref(req);
      res.render("/pa3/" + v + "/casework/caseworker/application/waiting-for-claim", {ref});
    });


  /****************************
   * Claim Service Navigation *
   ****************************/

    // Enter eligible area
    router.get("/pa3/" + v + "/casework/caseworker/claim-service/:ref/enter-area", function (req, res) {
      let ref = matchref(req);
      res.render("/pa3/" + v + "/casework/caseworker/claim-service/enter-area", {ref});
    });

    // Enter total claim amount
    router.get("/pa3/" + v + "/casework/caseworker/claim-service/:ref/total-amount", function (req, res) {
      let ref = matchref(req);
      res.render("/pa3/" + v + "/casework/caseworker/claim-service/total-amount", {ref});
    });

    // Claim amount confirmed
    router.get("/pa3/" + v + "/casework/caseworker/claim-service/:ref/amount-confirmed", function (req, res) {
      let ref = matchref(req);
      res.render("/pa3/" + v + "/casework/caseworker/claim-service/amount-confirmed", {ref});
    });

  /***************************
   * CW Update Task Statuses *
   ***************************/

    // Update application status based on FC decision
    router.post("/pa3/" + v + "/casework/caseworker/application/:ref/fc-review", function (req, res) {
      // get ref from URL and find ref in session data
      let ref = matchref(req);
      let thisapp = req.session.data['pa3'][v]['applications'].find(app => app.ref === ref);

      // create place to store caseworking info if it doesn't already exist
      thisapp.caseworking = thisapp.caseworking || {};

        if (req.session.data['fc-review'] == "Rejected") {
          thisapp.caseworking.fcoutcome = "Rejected";
          thisapp.status = "Rejected by Forestry Commission";
          res.redirect("/pa3/" + v + "/casework/caseworker/application/"+ref+"/tasklist-fcoutcome");
        } else {
          thisapp.caseworking.fcoutcome = "Accepted";
          thisapp.status = "Accepted by Forestry Commission";
          res.redirect("/pa3/" + v + "/casework/caseworker/application/"+ref+"/tasklist-fcoutcome");
        }
    });


    // FC review Decision (like the Grasslands task list): Reject and Withdraw are always
    // available; Progress to claim stage only once the Forestry Commission outcome task is
    // complete (Accepted). Each needs an explanation.
    router.post("/pa3/" + v + "/casework/caseworker/application/:ref/tasklist-fcoutcome", function (req, res) {
      let ref = matchref(req);
      let thisapp = req.session.data['pa3'][v]['applications'].find(app => app.ref === ref);
      thisapp.caseworking = thisapp.caseworking || {};

      const body = req.body || {};
      const selected = body['fc-decision'] || "";
      const notes = {
        reject: String(body['fc-decision-notes-reject'] || "").trim(),
        withdraw: String(body['fc-decision-notes-withdraw'] || "").trim(),
        progress: String(body['fc-decision-notes-progress'] || "").trim()
      };
      const taskComplete = thisapp.caseworking.fcoutcome == "Accepted" || thisapp.status == "Accepted by Forestry Commission";
      const allowed = ["Progress", "Reject", "Withdraw"];
      const keys = { Progress: "progress", Reject: "reject", Withdraw: "withdraw" };
      const reasons = {
        Progress: "Enter a reason for progressing this application to claim stage",
        Reject: "Enter a reason for rejecting this agreement",
        Withdraw: "Enter a reason for withdrawing this agreement"
      };

      const page = "/pa3/" + v + "/casework/caseworker/application/tasklist-fcoutcome";

      // nothing chosen (or an option that is not available yet)
      if (allowed.indexOf(selected) === -1) {
        return res.render(page, {
          ref, selected: "", notes,
          decisionError: "Select a decision",
          errors: [{ text: "Select a decision", href: "#fc-decision-progress" }]
        });
      }

      // every option needs an explanation
      const note = notes[keys[selected]];
      if (!note) {
        const noteError = {};
        noteError[keys[selected]] = reasons[selected];
        return res.render(page, {
          ref, selected, notes, noteError,
          errors: [{ text: reasons[selected], href: "#fc-decision-notes-" + keys[selected] }]
        });
      }

      const decision = {
        type: selected,
        note: note,
        date: new Date().toISOString().slice(0, 10)
      };
      clearDecisionAnswers(req);

      if (selected == "Progress") {
        // Accepted: record it and go straight to the stage 2 task list
        thisapp.caseworking.fcoutcome = "Accepted";
        thisapp.caseworking.decision = decision;
        thisapp.status = "Accepted by Forestry Commission";
        return req.session.save(function () {
          res.redirect("/pa3/" + v + "/casework/caseworker/application/" + ref + "/tasklist");
        });
      }

      // Reject / Withdraw: hold the decision until the caseworker confirms it
      thisapp.caseworking.pendingDecision = decision;
      req.session.save(function () {
        res.redirect("/pa3/" + v + "/casework/caseworker/application/" + ref + "/confirm-decision");
      });
    });


    // "Are you sure?" for Reject / Withdraw
    function confirmDecisionView(thisapp) {
      const p = thisapp.caseworking && thisapp.caseworking.pendingDecision;
      if (!p) return null;
      const reject = p.type == "Reject";
      return {
        verb: reject ? "reject" : "withdraw",
        verbIng: reject ? "Rejecting" : "Withdrawing",
        verbCap: reject ? "Reject" : "Withdraw"
      };
    }

    router.get("/pa3/" + v + "/casework/caseworker/application/:ref/confirm-decision", function (req, res) {
      let ref = matchref(req);
      let thisapp = req.session.data['pa3'][v]['applications'].find(app => app.ref === ref);
      const view = thisapp && confirmDecisionView(thisapp);
      if (!view) return res.redirect("/pa3/" + v + "/casework/caseworker/application/" + ref + "/tasklist-fcoutcome");
      res.render("/pa3/" + v + "/casework/caseworker/application/confirm-decision", Object.assign({ ref }, view));
    });

    router.post("/pa3/" + v + "/casework/caseworker/application/:ref/confirm-decision", function (req, res) {
      let ref = matchref(req);
      let thisapp = req.session.data['pa3'][v]['applications'].find(app => app.ref === ref);
      const view = thisapp && confirmDecisionView(thisapp);
      const back = "/pa3/" + v + "/casework/caseworker/application/" + ref + "/tasklist-fcoutcome";
      if (!view) return res.redirect(back);
      const answer = (req.body || {})['confirm-decision'];
      delete req.session.data['confirm-decision'];

      if (answer == "Yes") {
        const p = thisapp.caseworking.pendingDecision;
        thisapp.caseworking.decision = p;
        thisapp.status = p.type == "Reject" ? "Rejected" : "Withdrawn";
        delete thisapp.caseworking.pendingDecision;
      } else if (answer == "No") {
        delete thisapp.caseworking.pendingDecision;
      } else {
        return res.render("/pa3/" + v + "/casework/caseworker/application/confirm-decision",
          Object.assign({ ref, error: "Select yes or no" }, view));
      }
      req.session.save(function () { res.redirect(back); });
    });


    // Record eligible area outcome
    router.post("/pa3/" + v + "/casework/caseworker/application/:ref/record-area", function (req, res) {
      let ref = matchref(req);
      let thisapp = req.session.data['pa3'][v]['applications'].find(app => app.ref === ref);

      thisapp.caseworking = thisapp.caseworking || {};
      thisapp.caseworking.fcreview = thisapp.caseworking.fcreview || {};

      let answer = req.session.data['record-area'];
      thisapp.caseworking.fcreview['record-area'] = answer;

      if (answer == "Created") {
        // clear any previous failure notes
        delete thisapp.caseworking.fcreview['record-area-notes-notrecorded'];
      } else if (answer == "Not created") {
        thisapp.caseworking.fcreview['record-area-notes-notrecorded'] = req.session.data['record-area-notes-notrecorded'];
        // task 2 is locked again, so clear any previous outcome
        delete thisapp.caseworking.fcreview['tell-customer'];
      }

      // clear the shared session answers so they don't leak to other cases
      delete req.session.data['record-area'];
      delete req.session.data['record-area-notes-notrecorded'];

      res.redirect("/pa3/" + v + "/casework/caseworker/application/" + ref + "/tasklist");
    });
    

    // Tell the customer outcome
    router.post("/pa3/" + v + "/casework/caseworker/application/:ref/tell-customer", function (req, res) {
      let ref = matchref(req);
      let thisapp = req.session.data['pa3'][v]['applications'].find(app => app.ref === ref);

      thisapp.caseworking = thisapp.caseworking || {};
      thisapp.caseworking.fcreview = thisapp.caseworking.fcreview || {};

      let answer = req.session.data['tell-customer'];
      thisapp.caseworking.fcreview['tell-customer'] = answer;

      if (answer == "Notification sent") {
        thisapp.caseworking.fcreview['tell-customer-notes-sent'] = req.session.data['tell-customer-notes-sent'];
        delete thisapp.caseworking.fcreview['tell-customer-notes-notsent'];
      } else {
        thisapp.caseworking.fcreview['tell-customer-notes-notsent'] = req.session.data['tell-customer-notes-notsent'];
        delete thisapp.caseworking.fcreview['tell-customer-notes-sent'];
      }

      // clear the shared session answers so they don't leak to other cases
      delete req.session.data['tell-customer'];
      delete req.session.data['tell-customer-notes-sent'];
      delete req.session.data['tell-customer-notes-notsent'];

      res.redirect("/pa3/" + v + "/casework/caseworker/application/" + ref + "/tasklist");
    });


    // Complete FC review
    router.post("/pa3/" + v + "/casework/caseworker/application/:ref/tasklist", function (req, res) {
      let ref = matchref(req);
      let thisapp = req.session.data['pa3'][v]['applications'].find(app => app.ref === ref);
      thisapp.status = "Awaiting claim";
      res.redirect("/pa3/" + v + "/casework/caseworker/application/" + ref + "/waiting-for-claim");
    });


  /*************************
   * Claim Service Routing *
   *************************/

    // Enter the total eligible area of woodland included in the plan
    router.post("/pa3/" + v + "/casework/caseworker/claim-service/:ref/enter-area", function (req, res) {
      // get ref from URL and find ref in session data
      let ref = matchref(req);
      let thisapp = req.session.data['pa3'][v]['applications'].find(app => app.ref === ref);

      res.redirect("/pa3/" + v + "/casework/caseworker/claim-service/"+ref+"/total-amount");

    });

    // Confirm claim amount
    router.post("/pa3/" + v + "/casework/caseworker/claim-service/:ref/total-amount", function (req, res) {
      // get ref from URL and find ref in session data
      let ref = matchref(req);
      let thisapp = req.session.data['pa3'][v]['applications'].find(app => app.ref === ref);

      res.redirect("/pa3/" + v + "/casework/caseworker/claim-service/"+ref+"/amount-confirmed");

    });


  module.exports = router;

}