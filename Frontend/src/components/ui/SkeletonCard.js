import React from 'react';

const SkeletonCard = ({ variant = 'property-card', count = 1 }) => {
    const cards = Array.from({ length: count }, (_, i) => i);

    const renderPropertyCard = (key) => (
        <div key={key} className="skeleton-card skeleton-property">
            <div className="skeleton-image skeleton-shimmer" />
            <div className="skeleton-body">
                <div className="skeleton-line skeleton-title skeleton-shimmer" />
                <div className="skeleton-line skeleton-subtitle skeleton-shimmer" />
                <div className="skeleton-row">
                    <div className="skeleton-badge skeleton-shimmer" />
                    <div className="skeleton-badge skeleton-shimmer" />
                </div>
                <div className="skeleton-line skeleton-price skeleton-shimmer" />
            </div>
        </div>
    );

    const renderProfileCard = (key) => (
        <div key={key} className="skeleton-card skeleton-profile">
            <div className="skeleton-avatar skeleton-shimmer" />
            <div className="skeleton-body">
                <div className="skeleton-line skeleton-title skeleton-shimmer" />
                <div className="skeleton-line skeleton-subtitle skeleton-shimmer" />
                <div className="skeleton-row">
                    <div className="skeleton-badge skeleton-shimmer" />
                    <div className="skeleton-badge skeleton-shimmer" />
                    <div className="skeleton-badge skeleton-shimmer" />
                </div>
            </div>
        </div>
    );

    const renderListItem = (key) => (
        <div key={key} className="skeleton-card skeleton-list-item">
            <div className="skeleton-icon skeleton-shimmer" />
            <div className="skeleton-body" style={{ flex: 1 }}>
                <div className="skeleton-line skeleton-title skeleton-shimmer" />
                <div className="skeleton-line skeleton-subtitle skeleton-shimmer" />
            </div>
            <div className="skeleton-badge skeleton-shimmer" style={{ width: 80 }} />
        </div>
    );

    const renderCard = (key) => {
        switch (variant) {
            case 'profile':
                return renderProfileCard(key);
            case 'list-item':
                return renderListItem(key);
            case 'property-card':
            default:
                return renderPropertyCard(key);
        }
    };

    return (
        <>
            {cards.map((key) => renderCard(key))}

            <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }

        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            var(--bg-tertiary, #2a2d3e) 25%,
            var(--border-light, #363952) 37%,
            var(--bg-tertiary, #2a2d3e) 63%
          );
          background-size: 200px 100%;
          animation: skeleton-shimmer 1.4s ease infinite;
          border-radius: var(--radius-md, 8px);
        }

        .skeleton-card {
          background: var(--bg-card, #1e2030);
          border: 1px solid var(--border-light, #2a2d3e);
          border-radius: var(--radius-xl, 16px);
          overflow: hidden;
        }

        /* Property Card Skeleton */
        .skeleton-property .skeleton-image {
          width: 100%;
          height: 200px;
          border-radius: 0;
        }

        .skeleton-body {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .skeleton-line {
          height: 14px;
        }

        .skeleton-title {
          width: 70%;
          height: 18px;
        }

        .skeleton-subtitle {
          width: 50%;
        }

        .skeleton-price {
          width: 35%;
          height: 20px;
          margin-top: 0.25rem;
        }

        .skeleton-row {
          display: flex;
          gap: 0.5rem;
        }

        .skeleton-badge {
          width: 60px;
          height: 24px;
          border-radius: var(--radius-full, 100px);
        }

        /* Profile Card Skeleton */
        .skeleton-profile {
          padding: 1.5rem;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }

        .skeleton-profile .skeleton-body {
          padding: 0;
        }

        .skeleton-avatar {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-full, 100px);
          flex-shrink: 0;
        }

        /* List Item Skeleton */
        .skeleton-list-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
        }

        .skeleton-list-item .skeleton-body {
          padding: 0;
        }

        .skeleton-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-lg, 12px);
          flex-shrink: 0;
        }
      `}</style>
        </>
    );
};

export default SkeletonCard;
