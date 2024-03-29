const Yup = require("yup");
const captchapng = require("captchapng");
const Blog = require("../models/Blog");
const { sendEmail } = require("../utils/mailer");
const User = require("../models/User");
const Gallery = require("../models/Gallery");
const Comments = require("../models/Comments");
const jwt = require("jsonwebtoken");
const provinces = require("../utils/json/provinces");
const citiess = require("../utils/json/cities");
const { settourstatus } = require("./adminController");
const ZarinpalCheckout = require("zarinpal-checkout");
let CAPTCHA_NUM;

exports.getIndex = async (req, res, next) => {
  await settourstatus();

  try {
    const posts = await Blog.find({
      isAccept: "accept",
      city: Number(req.params.city),
      status: "Recruiting",
    }).sort({
      createdAt: "desc",
    });
    if (posts.length === 0) {
      const error = new Error("هیچی نیس");
      error.statusCode = 408;
      throw error;
    }

    res.status(200).json({ posts });
  } catch (err) {
    next(err);
  }
};
exports.getallcompany = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (user.type !== "admin") {
      const error = new Error("عدم دسترسی");
      error.statusCode = 405;
      throw error;
    }
    const posts = await User.find({
      type: "tour",
    }).sort({
      createdAt: "desc",
    });
    if (!posts) {
      const error = new Error("هیچی نیس");
      error.statusCode = 408;
      throw error;
    }

    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
};

exports.getCampTours = async (req, res, next) => {
  await settourstatus();

  try {
    const posts = await Blog.find({
      isAccept: "accept",
      user: req.params.id,
    }).sort({
      createdAt: "desc",
    });
    if (!posts) {
      const error = new Error("هیچی نیس");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
};
exports.getCampLeaders = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      const error = new Error("هیچی نیس");
      error.statusCode = 404;
      throw error;
    }

    const leaders = await this.findusers(user);

    res.status(200).json(leaders);
  } catch (err) {
    next(err);
  }
};
exports.getCampGallery = async (req, res, next) => {
  try {
    const posts = await Gallery.find({
      user: req.params.id,
      type: "permissionphoto",
    }).sort({
      createdAt: "desc",
    });
    if (!posts) {
      const error = new Error("هیچی نیس");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
};
exports.getRelatedTours = async (req, res, next) => {
  await settourstatus();

  try {
    const posts = await Blog.find({
      type: req.body.typep,
      _id: { $ne: req.body.id },
      status: "Recruiting",

      city: Number(req.params.city),
      isAccept: "accept",
    })
      .sort({
        createdAt: "desc",
      })
      .limit(5);

    if (!posts) {
      const error = new Error("هیچی نیس");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
};
exports.getPopularCamps = async (req, res, next) => {
  try {
    const camps = await User.find({
      type: "tour",
      city: Number(req.params.city),
      isAccept: "accept",
    })
      .sort({
        createdAt: -1,
      })
      .limit(5);

    const profilePhotos = await Gallery.find({
      type: "profilephoto",
    }).sort({
      createdAt: "desc",
    });
    const popCamps = [];
    await camps.forEach(async (element) => {
      const obj = {
        id: "",
        rate: 0,
        profilePhotos: [],
        description: "",
        name: "",
      };
      const arr = [];

      profilePhotos.forEach((param) => {
        if (param.user.toString() === element._id.toString()) {
          arr.push(param);
        }
      });
      obj.id = element._id;
      obj.profilePhotos = arr;
      obj.rate = element.rate;
      obj.description = element.description;
      obj.name = element.name;

      popCamps.push(obj);
    });
    if (popCamps.length === 0) {
      const error = new Error("هیچی نیس");
      error.statusCode = 408;
      throw error;
    }
    res.status(200).json(popCamps);
  } catch (err) {
    next(err);
  }
};

exports.getPopularTours = async (req, res, next) => {
  await settourstatus();

  try {
    const tours = await Blog.find({
      isAccept: "accept",
      status: "Recruiting",

      city: Number(req.params.city),
    })
      .sort({
        capacity: 1,
      })
      .limit(5);
    if (tours.length === 0) {
      const error = new Error("هیچی نیس");
      error.statusCode = 408;
      throw error;
    }

    res.status(200).json(tours);
  } catch (err) {
    next(err);
  }
};
exports.getSinglePost = async (req, res, next) => {
  try {
    const post = await Blog.findById(req.params.id);
    const user = await User.findById(post.user);

    post.joinedUsers = await this.findusersjoined(post);

    if (!post) {
      const error = new Error("هیجی نیس");
      error.statusCode = 404;
      throw error;
    }
    const obj = {
      _id: post._id,
      date: post.date,
      body: post.body,
      capacity: post.capacity,
      createdAt: post.createdAt,
      durationTime: post.durationTime,
      isAccept: post.isAccept,
      title: post.title,
      manualjoinedcount: post.manualjoinedcount,
      enddate: post.enddate,
      type: post.type,
      thumbnail: post.thumbnail,
      joinedUsers: post.joinedUsers,
      price: post.price,
      status: post.status,
    };
    res
      .status(200)
      .json({ post: obj, user: { id: user._id, name: user.name } });
  } catch (err) {
    next(err);
  }
};
exports.getpostjoiners = async (req, res, next) => {
  try {
    const post = await Blog.findById(req.params.id);

    post.joinedUsers = await this.findusersjoined(post);

    if (!post) {
      const error = new Error("هیجی نیس");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json(post.joinedUsers);
  } catch (err) {
    next(err);
  }
};
exports.getprovinces = async (req, res, next) => {
  try {
    const provines = provinces.provinces;

    res.status(200).json(provines);
  } catch (err) {
    next(err);
  }
};
exports.getcities = async (req, res, next) => {
  try {
    const cities = citiess.cities;
    let filcityies = cities.filter(
      (q) => q.province_id === Number(req.params.id)
    );

    res.status(200).json(filcityies);
  } catch (err) {
    next(err);
  }
};
exports.getSingleuser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    const profilePhotos = await Gallery.find({
      user: req.params.id,
      type: "profilephoto",
    }).sort({
      createdAt: "desc",
    });
    if (!user) {
      const error = new Error("هیجی نیس");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      name: user.name,
      profilePhotos: profilePhotos,
      description: user.description,
      username: user.username,
      rate: user.rate,
      phoneNumber: user.phoneNumber,
      id: user._id,
    });
  } catch (err) {
    next(err);
  }
};

exports.handleContactPage = async (req, res, next) => {
  const errorArr = [];

  const { name, email, message } = req.body;

  const schema = Yup.object().shape({
    name: Yup.string().required("نام و نام خانوادگی الزامی می باشد"),
    email: Yup.string()
      .email("آدرس ایمیل صحیح نیست")
      .required("آدرس ایمیل الزامی می باشد"),
    message: Yup.string().required("پیام اصلی الزامی می باشد"),
  });

  try {
    await schema.validate(req.body, { abortEarly: false });

    sendEmail(
      email,
      name,
      "پیام از طرف وبلاگ",
      `${message} <br/> ایمیل کاربر : ${email}`
    );

    res.status(200).json({ message: "پیام موفق شد" });
  } catch (err) {
    next(err);
  }
};

exports.searchTour = async (req, res, next) => {
  try {
    const posts = await Blog.filter((arrBirds) => arrBirds.includes("ov"));

    if (!posts) {
      const error = new Error("هیجی نیس");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
};
exports.getCaptcha = (req, res) => {
  CAPTCHA_NUM = parseInt(Math.random() * 9000 + 1000);
  const p = new captchapng(80, 30, CAPTCHA_NUM);
  p.color(0, 0, 0, 0);
  p.color(80, 80, 80, 255);

  const img = p.getBase64();
  const imgBase64 = Buffer.from(img, "base64");

  res.send(imgBase64);
};
exports.findusers = async (post) => {
  const ids = [];
  post.leaders.forEach((i) => {
    ids.push(i._id);
  });
  const joinedUsers = await User.find({ _id: { $in: ids } });
  const profilePhotos = await Gallery.find({ type: "profilephoto" }).sort({
    createdAt: "desc",
  });
  const i = [];
  joinedUsers.forEach((w) => {
    let obj = { profilephotoss: [] };
    obj._id = w._id;
    obj.email = w.email;
    obj.name = w.name;
    obj.username = w.username;
    profilePhotos.forEach((q) => {
      if (q.user.toString() === w._id.toString()) {
        obj.profilephotoss.push(q);
      }
    });
    i.push(obj);
  });
  post.leaders = i;
  return post.leaders;
};
exports.findusersjoined = async (post) => {
  const ids = [];
  post.joinedUsers.forEach((i) => {
    ids.push(i._id);
  });
  const joinedUsers = await User.find({ _id: { $in: ids } });
  const profilePhotos = await Gallery.find({ type: "profilephoto" }).sort({
    createdAt: "desc",
  });
  const i = [];
  joinedUsers.forEach((w) => {
    let obj = { profilephotoss: [] };
    obj._id = w._id;
    obj.email = w.email;
    obj.name = w.name;
    obj.username = w.username;
    profilePhotos.forEach((q) => {
      if (q.user.toString() === w._id.toString()) {
        obj.profilephotoss.push(q);
      }
    });
    i.push(obj);
  });
  post.joinedUsers = i;
  return post.joinedUsers;
};
exports.findcity = async (id) => {
  const cities = citiess.cities;
  let city = cities.find((q) => q.id === id);

  return city;
};
exports.createComment = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    const post = await Blog.findById(req.body.post);

    if (!user) {
      const error = new Error("هیجی نیس");
      error.statusCode = 404;
      throw error;
    }
    if (!post) {
      const error = new Error("هیجی نیس");
      error.statusCode = 404;
      throw error;
    }
    await Comments.create({
      post: post._id,
      user: user._id,
      comment: req.body.comment,
      reply: req.body.reply === "" ? user._id : req.body.reply,
    });

    res.status(200).json({ message: "حله" });
  } catch (err) {
    next(err);
  }
};
exports.postComments = async (req, res, next) => {
  try {
    const comments = await Comments.find({ post: req.params.id });
    const users = await User.find({ type: "tourist" });
    const pfs = await Gallery.find({ type: "profilephoto" }).sort({
      createdAt: "desc",
    });
    let access = false;
    const user = await User.findById(req.userId);
    const { _id } = user;

    const profile = { _id, commented: false };
    const profile2 = { _id, commented: true };
    const toursjoined = await Blog.find({
      _id: req.params.id,
      $or: [
        { joinedUsers: { $in: [profile] } },
        { joinedUsers: { $in: [profile2] } },
      ],
    });
    if (toursjoined.length !== 0) {
      access = true;
    }

    if (!comments) {
      const error = new Error("هیجی نیس");
      error.statusCode = 404;
      throw error;
    }
    const cms = [];
    comments.forEach((item) => {
      users.forEach((e) => {
        if (item.user.toString() === e._id.toString()) {
          const profilephotos = [];

          if (pfs!==[]) {
            pfs.forEach((p) => {
              if (p.user.toString() === e._id.toString()) {
                profilephotos.push(p);
              }
            });
          }
          
          let username = e.username;
          let userId = e._id;

          let cm = {
            ...item._doc,
            username,
            userId:userId,
            profilephoto: profilephotos[0]?.name,
          };
          cms.push(cm);

        }
      });
    });

    res.status(200).json({ comments: cms, accesswrite: access });
  } catch (err) {
    next(err);
  }
};
exports.userCommenter = async (id) => {
  const user = await User.findById(id);
  const profilePhotos = await Gallery.find({
    user: id,
    type: "profilephoto",
  }).sort({
    createdAt: "desc",
  });
  if (!user) {
    const error = new Error("هیجی نیس");
    error.statusCode = 404;
    throw error;
  }

  return {
    name: user.name,
    profilePhotos: profilePhotos,
    username: user.username,
    id: user._id,
  };
};
exports.paymony = async (req, res, next) => {
  try {
    const post = await Blog.findById(req.body.postId);
    const user = await User.findById(req.userId);

    const zarinpal = ZarinpalCheckout.create(
      "a47aea2b-27f3-41d9-a00c-dda053737e5c",
      false
    );

    zarinpal
      .PaymentRequest({
        Amount: post.price.toString(), // In Tomans
        CallbackURL:
          "http://192.168.43.153:3000/#/redirectPage?&UserId=" +
          req.userId +
          "&postId=" +
          req.body.postId +
          "",
        Description: `A Payment for ${req.userId}&${user.username}`,
        Email: user.email,
        Mobile: user.phoneNumber,
      })
      .then((response) => {
        if (response.status === 100) {
          console.log(response.url);
          return res.status(200).json(response.url);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  } catch (err) {
    next(err);
  }
};
exports.verify = async (req, res, next) => {
  try {
    const zarinpal = ZarinpalCheckout.create(
      "a47aea2b-27f3-41d9-a00c-dda053737e5c",
      false
    );
    const post = await Blog.findById(req.body.postId);

    if (!post) {
      const error = new Error("هیجی نیس");
      error.statusCode = 404;
      throw error;
    }
    if (req.body.Status !== "OK") {
      const error = new Error("خطا");
      error.statusCode = 410;
      throw error;
    }
    zarinpal
      .PaymentVerification({
        Amount: post.price.toString(), // In Tomans
        Authority: req.body.Authority,
      })
      .then(async (response) => {
        if (response.status === -21) {
          const error = new Error("خطا");
          error.statusCode = 409;
          throw error;
        } else {
          const user = await User.findById(req.body.userId);

          if (!user) {
            const error = new Error("هیجی نیس");
            error.statusCode = 404;
            throw error;
          }

          const { _id } = user;
          const profile = { _id };
          const touruser = await User.findById(post.user);
          touruser.blockedmoney = (await touruser.blockedmoney) + post.price;

          await post.joinedUsers.push(profile);
          // await user.joinedTours.push(post);
          touruser.save();
          post.save();

          console.log(`Verified! Ref ID: ${response.RefID}`);
          return res
            .status(200)
            .json({ refid: response.RefID, title: post.title });
        }
      })
      .catch((err) => {
        console.error(err);
      });
  } catch (err) {
    next(err);
  }
};

exports.commented = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("چنین یوزری نیست");
      error.statusCode = 404;
      throw error;
    }
    const { _id } = user;
    const trs = [];
    const profile = { _id, commented: false };
    const toursjoined = await Blog.find({ joinedUsers: { $in: [profile] } });
    await toursjoined.forEach(async (element) => {
      let now = new Date();
      let date = element.createdAt;
      if (now > date) {
        element.joinedUsers.forEach((item) => {
          if (item._id.toString() === user._id.toString()) {
            trs.push(element._id);

            item.commented === true;
            element.save();
          }
        });
      }
    });

    res.status(200).json(trs);
  } catch (error) {
    next(error);
  }
};
