function generateBlogListing() {
    const blogListing = document.querySelector(".blog-listing");

    blogPosts.forEach(post => {
        const postItem = document.createElement("div");
        postItem.classList.add("post-item");

        const postTitle = document.createElement("h2");
        const titleLink = document.createElement("a");
        titleLink.textContent = post.title;
        titleLink.href = post.link;
        postTitle.appendChild(titleLink);

        const postInfo = document.createElement("div");
        postInfo.classList.add("post-info");
        postInfo.innerHTML = `<span>${post.posted}</span> | <span>${post.author}</span>`;

        const postTags = document.createElement("div");
        postTags.classList.add("post-tags");
        postTags.textContent = "Tags: " + post.tags.join(", ");

        postItem.appendChild(postTitle);
        postItem.appendChild(postInfo);
        postItem.appendChild(postTags);

        blogListing.appendChild(postItem);
    });
}

function generateWordCloud() {
    const wordCloud = document.querySelector(".word-cloud");
    
    const tagCounts = {};

    blogPosts.forEach(post => {
        post.tags.forEach(tag => {
            if (tagCounts[tag]) {
                tagCounts[tag]++;
            } else {
                tagCounts[tag] = 1;
            }
        });
    });

    for (const tag in tagCounts) {
        const tagElement = document.createElement("span");
        tagElement.textContent = tag;
        tagElement.style.fontSize = `${tagCounts[tag] * 1.1}vw`; // Adjust font size based on counts
        wordCloud.appendChild(tagElement);
    }
}

async function loadBlogPosts() {
    try {
        const response = await fetch('./posts/summary-json'); // Adjust the path as needed
        if (!response.ok) {
            throw new Error('Failed to load blog posts data');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        return []; // Return an empty array in case of an error
    }
}

var blogPosts;
loadBlogPosts().then(postsData => {
    blogPosts = postsData;
    generateBlogListing();
    generateWordCloud();
});

// TODO Function to sort and filter blog posts (implement sorting and filtering logic here)
