import { apiUrl } from '../../api/client';

export default function ReportMedia({ media = [] }) {
  if (!media.length) return null;

  return (
    <div className="grid grid-cols-3 gap-2">
      {media.map((m, i) => {
        const src = apiUrl(m.url);

        if (m.mediaType === 'image') {
          return (
            <a key={m.url} href={src} target="_blank" rel="noreferrer">
              <img
                src={src}
                alt={`Report attachment ${i + 1}`}
                className="aspect-square w-full rounded-lg border border-navy-700 object-cover"
              />
            </a>
          );
        }
        if (m.mediaType === 'video') {
          return (
            <video
              key={m.url}
              src={src}
              controls
              className="aspect-square w-full rounded-lg border border-navy-700 bg-black object-cover"
            />
          );
        }
        return <audio key={m.url} src={src} controls className="col-span-3 w-full" />;
      })}
    </div>
  );
}