module.exports.showChatroom = (req, res) => {
  if (req.session.currentUser) {
    res.render("chatroom", { currentUser: req.session.currentUser });
  } else {
    req.flash("error", "Please login before entering chatroom!");
    res.redirect("/login");
  }
};
