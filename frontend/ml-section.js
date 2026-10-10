const searchInput = document.getElementById('searchInput');
const noResults = document.getElementById('noResults');
const topicCards = document.querySelectorAll('.ml-topic-card');

function searchTopics(query) {
    const searchTerm = query.toLowerCase().trim();
    let visibleCount = 0;

    topicCards.forEach((card) => {
        const title = card.getAttribute('data-title') || '';
        const description = card.getAttribute('data-description') || '';
        const cardTitle = card.querySelector('.topic-title').textContent.toLowerCase();
        const cardDescription = card.querySelector('.topic-description').textContent.toLowerCase();
        const matches =
            title.includes(searchTerm) ||
            description.includes(searchTerm) ||
            cardTitle.includes(searchTerm) ||
            cardDescription.includes(searchTerm);

        if (matches || searchTerm === '') {
            card.style.display = 'flex';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    noResults.style.display = visibleCount === 0 && searchTerm !== '' ? 'block' : 'none';
}

if (searchInput) {
    searchInput.addEventListener('input', (e) => searchTopics(e.target.value));
    document.querySelector('.search-button').addEventListener('click', () => searchTopics(searchInput.value));
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchTopics(searchInput.value);
    });
}
