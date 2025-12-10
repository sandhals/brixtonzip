// ===========================
// SIDEBAR TOGGLE
// ===========================
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.querySelector('.sidebar-toggle');
const mainWrapper = document.querySelector('.main-wrapper');

if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');

        // Save state to localStorage
        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebarCollapsed', isCollapsed);
    });
}

// Restore sidebar state on page load
document.addEventListener('DOMContentLoaded', () => {
    const stored = localStorage.getItem('sidebarCollapsed');
    const isCollapsed = stored === null || stored === 'true';

    if (isCollapsed && sidebar) {
        sidebar.classList.add('collapsed');
    }
});

// ===========================
// MOBILE MENU TOGGLE
// ===========================
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const sidebarBackdrop = document.querySelector('.sidebar-backdrop');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        mobileMenuToggle.classList.toggle('active');
        sidebar.classList.toggle('mobile-open');
        sidebarBackdrop.classList.toggle('active');
    });

    // Close sidebar when clicking backdrop
    if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener('click', () => {
            mobileMenuToggle.classList.remove('active');
            sidebar.classList.remove('mobile-open');
            sidebarBackdrop.classList.remove('active');
        });
    }

    // Close sidebar when clicking on a nav link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuToggle.classList.remove('active');
            sidebar.classList.remove('mobile-open');
            sidebarBackdrop.classList.remove('active');
        });
    });
}

// ===========================
// PROJECT FILTERING SYSTEM
// ===========================
const filterTags = document.querySelectorAll('.filter-tag');
const projectCards = document.querySelectorAll('.project-card');

// Initialize filter state
let activeFilter = 'all';

// Add click event listeners to all filter tags
filterTags.forEach(tag => {
    tag.addEventListener('click', () => {
        // Get the filter value from data attribute
        const filterValue = tag.getAttribute('data-filter');

        // Update active filter
        activeFilter = filterValue;

        // Update active state on filter tags
        filterTags.forEach(t => t.classList.remove('active'));
        tag.classList.add('active');

        // Filter the project cards
        filterProjects(filterValue);
    });
});

/**
 * Filters project cards based on selected category
 * @param {string} category - The category to filter by ('all' or specific tag)
 */
function filterProjects(category) {
    projectCards.forEach(card => {
        const cardTags = card.getAttribute('data-tags');

        if (category === 'all') {
            // Show all cards
            showCard(card);
        } else {
            // Check if card has the selected category tag
            if (cardTags && cardTags.includes(category)) {
                showCard(card);
            } else {
                hideCard(card);
            }
        }
    });
}

/**
 * Shows a project card with animation
 * @param {HTMLElement} card - The card element to show
 */
function showCard(card) {
    card.classList.remove('hidden');
    // Trigger reflow to restart animation
    void card.offsetWidth;
}

/**
 * Hides a project card with animation
 * @param {HTMLElement} card - The card element to hide
 */
function hideCard(card) {
    card.classList.add('hidden');
}

// ===========================
// SMOOTH SCROLL
// ===========================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));

        if (target) {
            // No header offset needed since sidebar is fixed
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - 20;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ===========================
// INTERSECTION OBSERVER FOR ANIMATIONS
// ===========================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe project cards for scroll animations
document.querySelectorAll('.project-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

// ===========================
// DYNAMIC PROJECT COUNT DISPLAY
// ===========================
function updateProjectCount() {
    const visibleProjects = document.querySelectorAll('.project-card:not(.hidden)').length;
    const totalProjects = projectCards.length;
    console.log(`Showing ${visibleProjects} of ${totalProjects} projects`);
}

// Update count whenever filters change
filterTags.forEach(tag => {
    tag.addEventListener('click', () => {
        setTimeout(updateProjectCount, 500);
    });
});

// ===========================
// HONG KONG MONTHLY FLOWERS
// ===========================
const monthlyFlowers = [
    { month: "january", flower: "ding-zhong flowers", zh_month: "一月", zh_flower: "吊鐘花" },
    { month: "february", flower: "red wind-chime trees", zh_month: "二月", zh_flower: "紅花風鈴木" },
    { month: "march", flower: "pink trumpet-trees", zh_month: "三月", zh_flower: "宮粉羊蹄甲" },
    { month: "april", flower: "cotton-tree blossoms", zh_month: "四月", zh_flower: "木棉花" },
    { month: "may", flower: "jacarandas", zh_month: "五月", zh_flower: "藍花楹" },
    { month: "june", flower: "flame-trees", zh_month: "六月", zh_flower: "鳳凰木" },
    { month: "july", flower: "cosmos", zh_month: "七月", zh_flower: "波斯菊" },
    { month: "august", flower: "plumbago", zh_month: "八月", zh_flower: "藍雪花" },
    { month: "september", flower: "fish-wood tree flowers", zh_month: "九月", zh_flower: "魚木花" },
    { month: "october", flower: "silvergrass", zh_month: "十月", zh_flower: "芒草" },
    { month: "november", flower: "hong kong orchid-trees", zh_month: "十一月", zh_flower: "洋紫荊" },
    { month: "december", flower: "winter bloomers", zh_month: "十二月", zh_flower: "冬季花卉" }
];

function updateFlowerSlogan() {
    const currentMonth = new Date().getMonth();
    const { month, flower, zh_month, zh_flower } = monthlyFlowers[currentMonth];
    const sloganElement = document.querySelector('.media-slogan p');

    if (sloganElement) {
        let showingEnglish = true;

        // Capitalize first letter of month
        const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);

        // Set initial text
        sloganElement.textContent = `It is ${capitalizedMonth} in Hong Kong; the ${flower} are blooming.`;

        // Fade between English and Chinese every 4 seconds
        setInterval(() => {
            // Fade out
            sloganElement.style.opacity = '0';

            // Change text after fade out
            setTimeout(() => {
                sloganElement.textContent = showingEnglish
                    ? `${zh_month}香港${zh_flower}正在盛開`
                    : `It is ${capitalizedMonth} in Hong Kong; the ${flower} are blooming.`;
                showingEnglish = !showingEnglish;

                // Fade in
                sloganElement.style.opacity = '1';
            }, 500);
        }, 4000);
    }
}

// ===========================
// INITIALIZATION
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Gingermite Floral Studio - Website Loaded');
    updateProjectCount();
    updateFlowerSlogan();
});

// ===========================
// UTILITY: DEBOUNCE FUNCTION
// ===========================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Debounced resize handler
const handleResize = debounce(() => {
    console.log('Window resized');
}, 250);

window.addEventListener('resize', handleResize);
