import { Tooltip } from "./Tooltip";

interface TagsListProps {
  tags: string[];
  maxVisible?: number;
}

export const TagsList: React.FC<TagsListProps> = ({ tags, maxVisible = 3 }) => {
  if (!tags || tags.length === 0) {
    return <span className="text-accent text-xs">No tags</span>;
  }

  const visibleTags = tags.slice(0, maxVisible);
  const remainingTags = tags.slice(maxVisible);
  const remainingCount = remainingTags.length;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visibleTags.map((tag: string, index: number) => (
        <span
          key={index}
          className="bg-primary/10 px-2 py-0.5 rounded text-primary text-xs"
        >
          #{tag}
        </span>
      ))}

      {remainingCount > 0 && (
        <Tooltip
          content={
            <div className="flex flex-col gap-1 max-w-xs">
              {remainingTags.map((tag: string, index: number) => (
                <span key={index} className="text-xs">
                  #{tag}
                </span>
              ))}
            </div>
          }
          position="top"
        >
          <span className="bg-primary/20 hover:bg-primary/30 px-2 py-0.5 rounded text-primary text-xs transition-colors cursor-pointer">
            +{remainingCount} more
          </span>
        </Tooltip>
      )}
    </div>
  );
};
