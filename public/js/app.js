
// display and undisplay sections (postsSection and usersSection) in search page
const searchedDivider = document.querySelector("#searchedDivider");
// check if currently in search page
if (searchedDivider) {
    const postsDivider = document.querySelector('#postsDivider');
    const usersDivider = document.querySelector('#usersDivider');
    postsDivider.addEventListener("click", function () {
        postsDivider.classList.add('toggledDivider');
        usersDivider.classList.remove('toggledDivider');
        document.querySelector('#postsSection').style.display = "flex";
        document.querySelector('#usersSection').style.display = "none";
    });
    usersDivider.addEventListener("click", function () {
        usersDivider.classList.add('toggledDivider');
        postsDivider.classList.remove('toggledDivider');
        document.querySelector('#postsSection').style.display = "none";
        document.querySelector('#usersSection').style.display = "flex";
    });
}

// window.onblur = function () {
//     alert("goodbye")
//     // tab is changed
// };
// window.onfocus = function () {

// };
