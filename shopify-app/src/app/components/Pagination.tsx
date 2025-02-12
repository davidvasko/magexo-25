interface PaginationProps {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
}

export default function Pagination({
  hasNextPage,
  hasPreviousPage,
  onNextPage,
  onPreviousPage,
}: PaginationProps) {
  return (
    <div className="flex justify-center gap-4 mt-8">
      <button
        onClick={onPreviousPage}
        disabled={!hasPreviousPage}
        className={`px-4 py-2 rounded-md ${
          hasPreviousPage
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'bg-gray-300 cursor-not-allowed'
        }`}
      >
        Previous
      </button>
      <button
        onClick={onNextPage}
        disabled={!hasNextPage}
        className={`px-4 py-2 rounded-md ${
          hasNextPage
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'bg-gray-300 cursor-not-allowed'
        }`}
      >
        Next
      </button>
    </div>
  );
}
