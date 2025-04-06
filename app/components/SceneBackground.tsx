interface SceneBackgroundProps {
  description: string;
}

export default function SceneBackground({ description }: SceneBackgroundProps) {
  const descriptionSlice =
    description.length > 200 ? description.slice(0, 200) + "..." : description;

  return (
    <div className="absolute inset-0">
      {/* Scene visual background */}
      <div className="absolute inset-0" />

      {/* Scene description overlay */}
      {description.length > 0 && (
        <div className="absolute top-0 left-0 right-0 px-12 py-4 bg-black/40 text-white/80 text-lg text-center break-words">
          {descriptionSlice}
        </div>
      )}
    </div>
  );
}
