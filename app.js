import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, EmailAuthProvider, GoogleAuthProvider, updatePassword, sendEmailVerification, sendPasswordResetEmail, signInWithPopup, updateProfile, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import {
  setDoc,
  getDoc,
  doc,
  getFirestore,
  collection,
  query,
  onSnapshot,
  orderBy,
  limit,
  addDoc, updateDoc, deleteDoc, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDioq5bvQ5Us7RhWOXHWwZvlkw2xzT1svg",
  authDomain: "isam-blog.firebaseapp.com",
  projectId: "isam-blog",
  storageBucket: "isam-blog.appspot.com",
  messagingSenderId: "273029650954",
  appId: "1:273029650954:web:dbe36dcb1f67cc7a85ddf3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const loginWithGoogleBtn = document.getElementById("loginWithGoogleBtn");
const logoutBtn = document.getElementById("logoutBtn");
const currentPageName = window.location.pathname.split("/").pop();
const userImg = document.getElementById("uimage");
const signupBtn = document.getElementById("signupBtn");
const signinBtn = document.getElementById("signinBtn");
const lbl = document.getElementById("uemail");
const resetPass = document.getElementById("resetpass");
const changePass = document.getElementById("changePass");
const owner = document.getElementById("owner");
const blogContent = document.getElementById("blogContent");
const blogTitle = document.getElementById("blogTitle");
const content = document.getElementById("content");
let blogContentContainer //= document.getElementById("blogContentContainer");
let blogs;
let blogData;
let blogID;
let clickedBlog
let lgnBtn;
let postBtn = document.getElementById("blogPost");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn")
let submitReplyBtn;// = document.getElementById("submitReply")
const searchBarBtn = document.getElementById("searchBar");

const storeUserData = async (uid, displayName, photoURL, email) => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnapshot = await getDoc(userRef);

    // Check if the user already exists
    if (!userSnapshot.exists()) {
      // If the user doesn't exist, add them to the "users" collection
      const userData = {
        displayName,
        photoURL,
        uid,
        email
      };

      await setDoc(userRef, userData);
    }
  } catch (error) {
    console.error("Error storing user data:", error);
  }
};


const loadReplies = () => {
  const getBlogID = document.getElementById("blogTitleByID").getAttribute("data-blogID");
  console.log(getBlogID);
  const q = query(collection(db, "replies"), where("blogID", "==", getBlogID));
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const blogsHTML = querySnapshot.docs
      .map((doc) => {
        const blogs = doc.data();
        const date = new Date(blogs.createdAt); //.toString().substring(4, 15)
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const formattedTime = `${hours}:${minutes}`;
        const photoURL = blogs.photoURL;
        const displayName = blogs.displayName;
        const reply = blogs.reply;
        // date.toString().substring(4, 15)
        const currentTime12Hrs = date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        });
        /*<p id="time">${currentTime12Hrs}</p>*/
        return `
        <div id="userReplies"><img id="replyUserPic" src="${photoURL}" class="max-w-sm rounded-lg shadow-2xl">
        <div id="replyDetails"><div><span id="date">${date.toString().substring(4, 15)}</span></div>
        <span id="userName">${displayName}</span>
        <div><span id="userReply" data-createdAt="${blogs.createdAt}">${reply}</span></div>
        </div></div>
        `;
      })
      .join("");
    document.getElementById("replyContainer").innerHTML = blogsHTML;
  });
}

const loadBlogs = () => {
  const q = query(collection(db, "blog"), orderBy("createdAt", "desc"));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    blogs = querySnapshot.docs.map((doc) => doc.data());

    const blogsHTML = querySnapshot.docs
      .map((doc) => {
        const blogs = doc.data();
        const timestamp = blogs.createdAt;
        const date = new Date(timestamp);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const formattedTime = `${hours}:${minutes}`;

        return `
          <div class="collapse bg-base-200 bpost">
            <input type="radio" name="my-accordion-1" />
            <div class="collapse-title text-xl font-medium">
              ${blogs.title}
            </div>
            <div class="collapse-content">
              <p>${blogs.text.substring(0, 250)} <a style="color: orange;" class="readMore" data-createdAt="${timestamp}" data-blog-id="${doc.id}"><u>Read More...</u></a></p>
              <div class="avatar" id="detailContainer">
                <div class="w-10 rounded">
                  <img src="${blogs.photoURL}" alt="Tailwind-CSS-Avatar-component" />
                </div>
                <p id="blogCreator">${blogs.displayName}</p>
                <p id="blogDate">${date.toString().substring(4, 15)} </p>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    content.innerHTML = blogsHTML;

    // Add event listener to all elements with class "readMore"
    const readMoreElements = document.querySelectorAll('.readMore');
    readMoreElements.forEach((readMoreElement) => {
      readMoreElement.addEventListener('click', async () => {
        blogID = readMoreElement.getAttribute('data-createdAt');
        const clickedBlogID = readMoreElement.getAttribute('data-blog-id');

        // Log the relevant blog's data
        const clickedBlog = blogs.find(blog => blog.id === clickedBlogID);
        if (clickedBlog) {
          console.log("Clicked Blog Data:", clickedBlog);

          // Store clickedBlog data in localStorage
          localStorage.setItem('clickedBlogData', JSON.stringify(clickedBlog));

          // Now, navigate to the new page
          window.location.href = `viewblogpost.html?id=${clickedBlogID}`;
        } else {
          console.error("Clicked Blog not found");
        }
      });
    });
  });
};

searchBarBtn && searchBarBtn.addEventListener("keyup", (event) => {

  const searchValue = event.target.value.toLowerCase(); // Convert to lowercase for case-insensitive comparison
  let searchBarHTML = `<ul class="menu bg-base-200 w-56 rounded-box">`;
  blogs.forEach((blog) => {
    const blogTitle = blog.title.toLowerCase(); // Convert to lowercase for case-insensitive comparison

    if (blogTitle.includes(searchValue)) {
      searchBarHTML +=
        `<li><a>${blog.title}</a></li>`
        // console.log(blog.title);

    }

  })
  searchBarHTML += `</ul>`;
  console.log(searchBarHTML)
});

const loadBlogByID = () => {
  // Retrieve the clickedBlog data from localStorage
  const clickedBlogData = JSON.parse(localStorage.getItem('clickedBlogData'));

  // Use the data to update your HTML
  if (clickedBlogData) {
    const date = new Date(clickedBlogData.createdAt);

    const blogContentContainerHTML = `
      <div class="hero min-h-screen bg-base-200">
        <div class="hero-content flex-col lg:flex-row">
          <img id="userPic" src="${clickedBlogData.photoURL}" class="max-w-sm rounded-lg shadow-2xl" />
          <div>
            <h1 id="blogTitleByID" class="text-5xl font-bold" data-blogID="${clickedBlogData.createdAt}">${clickedBlogData.title}</h1>
            <p id="blogContentByID" class="py-6">${clickedBlogData.text}</p>
            <div class="avatar" id="blogDetailContainer">
              <p id="blogCreator">Published by: ${clickedBlogData.displayName}</p>
              <p id="blogDate">Date: ${date.toString().substring(4, 15)} </p>
            </div>
            <div id="replyBox"><label for="reply">Add Your Thought</label><label for="reply" id="lblReply">Reply</label>
            <textarea class="textarea textarea-primary" id="reply" placeholder="Add your reply"></textarea>
            <button id="submitReply" class="btn btn-primary btn-wide">Submit</button></div>
            <div id="replyContainer"></div>
            </div>
            </div>
        </div>
      </div>
    `;

    // Update your HTML container with the data
    const blogContentContainer = document.getElementById("blogContentContainer");
    blogContentContainer.innerHTML = blogContentContainerHTML;
    // Clear localStorage after retrieving the data
    // localStorage.removeItem('clickedBlogData');
    submitReplyBtn = document.getElementById("submitReply");
    submitReplyBtn && submitReplyBtn.addEventListener("click", sendBlogReply);
  } else {
    console.error("Clicked Blog data not found in localStorage");
  }



};


const setNavBar = () => {
  owner.innerHTML = `<div class="navbar bg-base-100">
        <div class="flex-1">
            <a href="" class="btn btn-ghost text-xl">Kawish</a>
        </div>
        <div class="blogPost">
                <button class="btn btn-sm btn-success" id="blogPost">Post</button>
                </div>
        <div class="flex-none gap-2">
            <input type="text" placeholder="Search" class="input input-bordered w-24 md:w-auto" />

            <div class="dropdown dropdown-end">
                <div tabindex="0" role="button" class="btn btn-ghost" id="lgnBtn">
                    <div class="w-10 rounded-full">
                        LOGIN
                    </div>
                </div>
            </div>
        </div>
      </div>`;
  lgnBtn = document.getElementById("lgnBtn");
  postBtn = document.getElementById("blogPost");
  postBtn.addEventListener("click", gotoBlogPage);
  lgnBtn && lgnBtn.addEventListener("click", () => {
    console.log(lgnBtn);
    window.location.href = "login.html";
  });
}

const gotoBlogPage = () => {
  const user = auth.currentUser;
  if (user) {
    window.location.href = "createblog.html";
  }
  else if (!user) {
    alert("You need to login first to create a post!")
    window.location.href = "login.html";
  }
}

const onLoad = () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      storeUserData(user.uid, user.displayName, user.photoURL, user.email);
      if (!user.emailVerified) {
        alert("Please verify your email before accessing the blog.");
        logOut();
        window.location.href = "login.html";
        return;
      }
      else if (user.emailVerified) {
        if (currentPageName !== "index.html" && currentPageName !== "createblog.html" && currentPageName !== "viewblogpost.html") {
          window.location.href = "index.html";
        }
      }
      lbl.innerText = user.displayName;
      if (user.photoURL) {
        userImg.src = user.photoURL;
        // createBlog();

      }
    } else if (!user && (currentPageName === "index.html" || currentPageName === "" || currentPageName === "createblog.html" || currentPageName === "viewblogpost.html")) {
      setNavBar();
      if (currentPageName !== "index.html" && currentPageName !== "" && currentPageName !== "signup.html" && currentPageName !== "login.html") {
        window.location.href = "index.html";
      }
    }
    if (currentPageName !== "viewblogpost.html" && currentPageName !== "createblog.html")
      loadBlogs();
    if (currentPageName === "viewblogpost.html") {
      loadBlogByID();
      loadReplies();

    }
  });
};

onLoad();

const addDataInFirestore = async () => {
  const fName = document.getElementById("fname").value;
  const lName = document.getElementById("lname").value;
  email = document.getElementById("emailid").value;
  password = document.getElementById("pass").value;
  const cpass = document.getElementById("cpass").value;

  udisplayName = `${fName} ${lName}`;

  if (password === cpass && cpass !== "" && fName !== "" && lName !== "" && email !== "") {
    if (cpass.length < 6 && password.length < 6) {
      alert("Please enter a password at least 6 characters long!");
    }
    else {
      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          sendEmailVerification(auth.currentUser)
            .then(() => {
              updateProfile(auth.currentUser, {
                displayName: udisplayName, photoURL: "https://api-private.atlassian.com/users/4f5f736dffd9036ec97f3e366931bc7c/avatar"
              }).then(() => {

              }).catch((error) => {
                console.error("Error during sign up:", error);
              });
            });
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.error("Error during sign up:", errorCode, errorMessage);
        });
    }
  }
  else {
    alert("Please fill all the fields!");
  }
};

const forgotPassword = () => {
  const emailInput = document.getElementById("email");
  if (emailInput) {
    const email = document.getElementById("email").value;
    if (email != "") {
      sendPasswordResetEmail(auth, email)
        .then(() => {
          alert("Password reset email sent!");
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.error("Error sending password reset email:", errorCode, errorMessage);
        });
    }
    else {
      alert("Please enter an email to reset the password!");
    }
  }
  else if (!emailInput) {
    const user = auth.currentUser;
    const email = user.email;
    sendPasswordResetEmail(auth, email)
      .then(() => {
        alert("Password reset email sent!");
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error("Error sending password reset email:", errorCode, errorMessage);
      });
  }
};

const signIn = () => {
  email = document.getElementById("email").value;
  password = document.getElementById("password").value;
  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      // Handle the signed-in user
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      alert("Invalid credentials!");
    });
};

signinBtn && signinBtn.addEventListener("click", signIn);

const signInWithGoogle = () => {
  signInWithPopup(auth, provider)
    .then(() => {
      // Handle the signed-in user with Google
    })
    .catch((error) => {
      console.error(error);
    });
};

const sendBlogReply = async () => {
  const user = auth.currentUser;
  const reply = document.getElementById("reply").value;
  const id = Date.now();
  const getBlogID = document.getElementById("blogTitleByID").getAttribute("data-blogID");
  console.log(getBlogID);
  try {
    if (reply.trim()) {
      const { email, displayName, photoURL, uid } = user;
      const payload = {
        createdAt: id,
        blogID: getBlogID,
        reply,
        uid,
        email,
        displayName,
        photoURL
      };
      await setDoc(doc(db, "replies", `${id}`), payload);
      alert("Your reply has been sent!")
      document.getElementById("reply").value = "";
    } else {
      alert("Please enter a reply!");
    }
  }
  catch (err) {
    console.error(err);
  }
}

const createBlog = async () => {
  const user = auth.currentUser;
  const text = document.getElementById("cname").value;
  const title = document.getElementById("tname").value;
  console.log(text, title);
  const id = Date.now();

  try {
    if (user) {
      if (text.trim() && title.trim()) {
        const { email, displayName, photoURL, uid } = user;
        const payload = {
          createdAt: id,
          title,
          text,
          uid,
          email,
          displayName,
          photoURL
        };
        await setDoc(doc(db, "blog", `${id}`), payload);
        alert("Your post has been made!")
        window.location.href = "index.html"; //change with blog page
      } else {
        alert("Please enter all the relevant content!");
      }
    }
    else if (!user) {
      alert("You need to first log in to create a blog post!");
    }
  } catch (err) {
    console.log(err);
  }
};

const logOut = () => {
  signOut(auth).then(() => {
    // Sign-out successful.
  }).catch((error) => {
    console.error(error)
  });
};

const addHoverEffect = () => {
  resetPass.classList.add("hover-effect");
};

const removeHoverEffect = () => {
  resetPass.classList.remove("hover-effect");
};

const reauthenticateWithCredential = async (user, credential) => {
  try {
    const credentialResult = await signInWithEmailAndPassword(auth, credential.email, credential.password);
    return credentialResult;
  } catch (error) {
    console.error("Reauthentication failed:", error);
    return null;
  }
};

const changePassword = async () => {
  const user = auth.currentUser;
  const email = user.email;
  const pass = prompt("Enter your current password: ");
  if (!pass) {
    return;
  }
  const newPassword = prompt("Enter new password");
  if (!newPassword) {
    return;
  }
  const newcPassword = prompt("Confirm your password");
  if (newcPassword.length < 6) {
    alert("Password should be at least 6 characters long!");
    return;
  }

  if (newPassword === newcPassword && newPassword.length >= 6) {
    try {
      const credential = { email, pass };

      if (!credential) {
        alert("Reauthentication failed.");
        return;
      }

      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      alert("Password updated successfully!");
    } catch (error) {
      console.error("Error updating password:", error);
      alert("Error updating password. Please try again.");
    }
  } else if (newPassword !== newcPassword) {
    alert("Error! Your passwords don't match!");
  }
};

loginWithGoogleBtn && loginWithGoogleBtn.addEventListener("click", signInWithGoogle);

logoutBtn && logoutBtn.addEventListener("click", logOut);
cancelBtn && cancelBtn.addEventListener("click", () => {
  window.location.href = "index.html";
})
submitBtn && submitBtn.addEventListener("click", createBlog)
resetPass && resetPass.addEventListener("click", forgotPassword);
resetPass && resetPass.addEventListener("mouseover", addHoverEffect);
resetPass && resetPass.addEventListener("mouseout", removeHoverEffect);


resetPass && resetPass.addEventListener("click", forgotPassword);
changePass && changePass.addEventListener("click", changePassword);

signupBtn && signupBtn.addEventListener("click", addDataInFirestore);
postBtn && postBtn.addEventListener("click", gotoBlogPage);