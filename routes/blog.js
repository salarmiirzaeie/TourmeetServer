const { Router } = require("express");

const blogController = require("../controllers/blogController");
const { authenticated } = require("../middlewares/auth");

const router = new Router();

//  @desc   Weblog Index Page
//  @route  GET /
router.get("/getall/:city", blogController.getIndex);
router.get("/getPopularCamps/:city", blogController.getPopularCamps);
router.get("/getPopularTours/:city", blogController.getPopularTours);
router.get("/provinces", blogController.getprovinces);
router.get("/cities/:id", blogController.getcities);

router.get("/getCampTours/:id", blogController.getCampTours);
router.get("/getCampGallery/:id", blogController.getCampGallery);
router.get("/getcampleaders/:id", blogController.getCampLeaders);
router.get("/getallcamps",authenticated, blogController.getallcompany);
router.get("/commented",authenticated, blogController.commented);

//  @desc   Weblog Post Page
//  @route  GET /post/:id
router.get("/joinedusers/:id", blogController.getpostjoiners);
router.get("/post/:id", blogController.getSinglePost);
router.get("/postcomments/:id",authenticated, blogController.postComments);

router.get("/user/:id", blogController.getSingleuser);
router.post("/relatedTours/:city", blogController.getRelatedTours);
router.post("/paymony",authenticated, blogController.paymony);
router.post("/varify", blogController.verify);

//  @desc   Weblog Numric Captcha
//  @route  GET /captcha.png
router.get("/captcha.png", blogController.getCaptcha);

//  @desc   Handle Contact Page
//  @route  POST /contact
router.post("/contact", blogController.handleContactPage);
router.post("/addcm", authenticated, blogController.createComment);
router.post("/searchtour", blogController.searchTour);

module.exports = router;
