// JS/tech-portal.js - Video Library for Field Personnel

class TechPortal {
    constructor() {
        this.videos = [];
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.init();
    }

    init() {
        this.loadVideos();
        this.setupEventListeners();
        this.renderVideos();
        this.checkAdminAccess();
    }

    loadVideos() {
        // TEMPORARY: Mock video data
        // Replace with API call when backend is ready:
        // fetch('/api/training-videos').then(res => res.json())
        
        this.videos = [
            {
                id: 1,
                title: 'Antenna Installation - Complete Guide',
                description: 'Step-by-step instructions for installing cellular antennas on tower structures',
                category: 'antenna',
                duration: '12:45',
                thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                uploadDate: '2025-01-15'
            },
            {
                id: 2,
                title: 'Waveguide Mounting Techniques',
                description: 'Proper methods for mounting and securing waveguide runs',
                category: 'waveguide',
                duration: '8:30',
                thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                uploadDate: '2025-01-10'
            },
            {
                id: 3,
                title: 'Radio Equipment Configuration',
                description: 'How to configure and test radio equipment on-site',
                category: 'radio',
                duration: '15:20',
                thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                uploadDate: '2025-01-08'
            },
            {
                id: 4,
                title: 'Fiber Optic Cable Installation',
                description: 'Best practices for fiber optic cable routing and termination',
                category: 'fiber',
                duration: '10:15',
                thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                uploadDate: '2025-01-05'
            },
            {
                id: 5,
                title: 'Tower Climbing Safety Procedures',
                description: 'Essential safety protocols for tower climbing and working at height',
                category: 'safety',
                duration: '18:40',
                thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                uploadDate: '2025-01-01'
            },
            {
                id: 6,
                title: 'Common Installation Issues & Solutions',
                description: 'Troubleshooting guide for frequently encountered problems',
                category: 'troubleshooting',
                duration: '14:25',
                thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                uploadDate: '2024-12-28'
            }
        ];
    }

    setupEventListeners() {
        // Category filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentCategory = e.target.dataset.category;
                this.renderVideos();
            });
        });

        // Search functionality
        const searchInput = document.getElementById('videoSearch');
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.renderVideos();
        });

        // Modal close handlers
        document.getElementById('closeVideoModal').addEventListener('click', () => this.closeModal());
        document.getElementById('modalBackdrop').addEventListener('click', () => this.closeModal());

        // Admin modal handlers
    const manageBtn = document.getElementById('manageVideosBtn');
    const closeAdminBtn = document.getElementById('closeAdminModal');
    
    if (manageBtn) {
        manageBtn.addEventListener('click', () => this.openAdminModal());
    }
    
    if (closeAdminBtn) {
        closeAdminBtn.addEventListener('click', () => this.closeAdminModal());
    }

    // Admin tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', (e) => this.switchAdminTab(e.target.dataset.tab));
    });

    // Add video form
    const addVideoForm = document.getElementById('addVideoForm');
    if (addVideoForm) {
        addVideoForm.addEventListener('submit', (e) => this.handleAddVideo(e));
    }
    }


    renderVideos() {
        const grid = document.getElementById('videoGrid');
        const emptyState = document.getElementById('emptyState');
        
        // Filter videos
        let filteredVideos = this.videos.filter(video => {
            const matchesCategory = this.currentCategory === 'all' || video.category === this.currentCategory;
            const matchesSearch = video.title.toLowerCase().includes(this.searchQuery) || 
                                 video.description.toLowerCase().includes(this.searchQuery);
            return matchesCategory && matchesSearch;
        });

        // Show empty state if no videos
        if (filteredVideos.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        grid.style.display = 'grid';
        emptyState.style.display = 'none';

        // Render video cards
        grid.innerHTML = filteredVideos.map(video => this.createVideoCard(video)).join('');

        // Add click handlers to video cards
        document.querySelectorAll('.video-card').forEach(card => {
            card.addEventListener('click', () => {
                const videoId = parseInt(card.dataset.videoId);
                this.openVideo(videoId);
            });
        });
    }

    createVideoCard(video) {
        const categoryLabels = {
            'antenna': 'Antenna Installation',
            'waveguide': 'Waveguide',
            'radio': 'Radio Equipment',
            'fiber': 'Fiber/Coax',
            'safety': 'Safety',
            'troubleshooting': 'Troubleshooting'
        };

        return `
            <div class="video-card" data-video-id="${video.id}">
                <div class="video-thumbnail">
                    <img src="${video.thumbnail}" alt="${video.title}">
                    <div class="video-duration">${video.duration}</div>
                    <div class="play-overlay">
                        <svg width="48" height="48" fill="white" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </div>
                </div>
                <div class="video-info">
                    <div class="video-category-badge">${categoryLabels[video.category]}</div>
                    <h3 class="video-card-title">${video.title}</h3>
                    <p class="video-card-description">${video.description}</p>
                </div>
            </div>
        `;
    }

    openVideo(videoId) {
        const video = this.videos.find(v => v.id === videoId);
        if (!video) return;

        // Update modal content
        document.getElementById('videoPlayer').src = video.videoUrl;
        document.getElementById('videoTitle').textContent = video.title;
        document.getElementById('videoDescription').textContent = video.description;
        document.getElementById('videoDuration').textContent = video.duration;
        document.getElementById('videoCategory').textContent = video.category.toUpperCase();

        // Show modal
        document.getElementById('videoModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('videoModal').classList.remove('active');
        document.getElementById('videoPlayer').src = '';
        document.body.style.overflow = '';
    }
    // ✅ Add new methods
openAdminModal() {
    document.getElementById('adminModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    this.renderAdminVideoList();
    this.renderCategoryList();
}

// ✅ ADD THIS NEW METHOD
checkAdminAccess() {
    const userRole = localStorage.getItem('userRole') || 'field';
    console.log('🔍 Checking admin access. Current role:', userRole); // Debug log
    
    const manageBtn = document.getElementById('manageVideosBtn');
    
    if (userRole === 'admin' && manageBtn) {
        manageBtn.style.display = 'flex';
        console.log('✅ Admin detected - Manage Videos button shown'); // Debug log
    } else {
        console.log('❌ Not admin - button hidden'); // Debug log
    }
}

closeAdminModal() {
    document.getElementById('adminModal').classList.remove('active');
    document.body.style.overflow = '';
}

switchAdminTab(tabName) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

handleAddVideo(e) {
    e.preventDefault();
    
    const newVideo = {
        id: Date.now(),
        title: document.getElementById('videoTitleInput').value,
        description: document.getElementById('videoDescInput').value,
        category: document.getElementById('videoCategoryInput').value,
        duration: document.getElementById('videoDurationInput').value,
        videoUrl: this.convertToEmbedUrl(document.getElementById('videoUrlInput').value),
        thumbnail: document.getElementById('videoThumbnailInput').value || this.getYouTubeThumbnail(document.getElementById('videoUrlInput').value),
        uploadDate: new Date().toISOString().split('T')[0]
    };
    
    this.videos.push(newVideo);
    alert('Video added successfully!');
    e.target.reset();
    this.renderVideos();
    this.renderAdminVideoList();
}

convertToEmbedUrl(url) {
    // Convert YouTube watch URL to embed URL
    if (url.includes('youtube.com/watch')) {
        const videoId = url.split('v=')[1].split('&')[0];
        return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
}

getYouTubeThumbnail(url) {
    if (url.includes('youtube.com')) {
        const videoId = url.split('v=')[1]?.split('&')[0];
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    return 'https://via.placeholder.com/320x180?text=Video';
}

deleteVideo(videoId) {
    if (confirm('Are you sure you want to delete this video?')) {
        this.videos = this.videos.filter(v => v.id !== videoId);
        this.renderVideos();
        this.renderAdminVideoList();
        alert('Video deleted successfully!');
    }
}

renderAdminVideoList() {
    const listEl = document.getElementById('adminVideoList');
    if (!listEl) return;
    
    listEl.innerHTML = this.videos.map(video => `
        <div class="admin-video-item">
            <img src="${video.thumbnail}" alt="${video.title}" class="admin-video-thumb">
            <div class="admin-video-info">
                <h4>${video.title}</h4>
                <p>${video.category} • ${video.duration}</p>
            </div>
            <div class="admin-video-actions">
                <button class="btn-icon-small delete" onclick="techPortal.deleteVideo(${video.id})">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

renderCategoryList() {
    // Implementation for category management
    const categories = [
        { name: 'Antenna Installation', slug: 'antenna' },
        { name: 'Waveguide', slug: 'waveguide' },
        { name: 'Radio Equipment', slug: 'radio' },
        { name: 'Fiber/Coax', slug: 'fiber' },
        { name: 'Safety Procedures', slug: 'safety' },
        { name: 'Troubleshooting', slug: 'troubleshooting' }
    ];
    
    const listEl = document.getElementById('categoryList');
    if (!listEl) return;
    
    listEl.innerHTML = categories.map(cat => `
        <div class="category-item">
            <div>
                <div class="category-item-name">${cat.name}</div>
                <div class="category-item-slug">${cat.slug}</div>
            </div>
        </div>
    `).join('');
    }
}

// Initialize Tech Portal
const techPortal = new TechPortal();