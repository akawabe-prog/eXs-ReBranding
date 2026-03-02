document.addEventListener('DOMContentLoaded', () => {
    const categoryButtons = document.querySelectorAll('#detail-category-filter .filter-btn');
    const yearFilter = document.getElementById('detail-year-filter');
    const monthFilter = document.getElementById('detail-month-filter');
    const relatedItems = document.querySelectorAll('.related-item');
    const noResult = document.getElementById('detail-no-result');

    if (!categoryButtons.length || !yearFilter || !monthFilter || !relatedItems.length || !noResult) {
        return;
    }

    let activeCategory = 'all';

    const applyFilters = () => {
        const selectedYear = yearFilter.value;
        const selectedMonth = monthFilter.value;
        let visibleCount = 0;

        relatedItems.forEach((item) => {
            const categoryMatch = activeCategory === 'all' || item.dataset.category === activeCategory;
            const yearMatch = selectedYear === 'all' || item.dataset.year === selectedYear;
            const monthMatch = selectedMonth === 'all' || item.dataset.month === selectedMonth;
            const isVisible = categoryMatch && yearMatch && monthMatch;

            item.classList.toggle('hidden', !isVisible);
            if (isVisible) visibleCount += 1;
        });

        noResult.classList.toggle('hidden', visibleCount > 0);
    };

    categoryButtons.forEach((button) => {
        button.addEventListener('click', () => {
            activeCategory = button.dataset.filter;
            categoryButtons.forEach((btn) => btn.classList.remove('active'));
            button.classList.add('active');
            applyFilters();
        });
    });

    yearFilter.addEventListener('change', applyFilters);
    monthFilter.addEventListener('change', applyFilters);
    applyFilters();
});
