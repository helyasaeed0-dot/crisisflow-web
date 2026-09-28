import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Crosshair, ImagePlus, X, Send, MapPin, Clock } from 'lucide-react';
import { incidentApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import useGeolocation from '../../hooks/useGeolocation';
import LocationPicker from '../../components/map/LocationPicker';
import EmergencyCallBanner from '../../components/EmergencyCallBanner';
import { CATEGORY_META } from '../../utils/constants';
import { formatDateTime } from '../../utils/format';

const STEPS = ['Type', 'Location', 'Details', 'Review'];
const ACCEPTED_TYPES =
  'image/jpeg,image/png,image/webp,video/mp4,video/webm,audio/mpeg,audio/mp4,audio/webm,audio/wav';
const MAX_FILES = 3;
const MAX_FILE_MB = 20;

export default function ReportEmergency() {
  const navigate = useNavigate();
  const geo = useGeolocation();
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reportedAt] = useState(() => new Date());
  const filesRef = useRef(files);

  // Ask for GPS as soon as the page opens
  const requestLocation = geo.request;
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Use GPS only if the user has not already picked a spot on the map
  useEffect(() => {
    if (geo.position) {
      setLocation((prev) => prev || { latitude: geo.position.latitude, longitude: geo.position.longitude });
    }
  }, [geo.position]);

  // Free preview URLs when the page closes
  useEffect(() => {
    filesRef.current = files;
  }, [files]);
  useEffect(() => () => filesRef.current.forEach((f) => URL.revokeObjectURL(f.url)), []);

  const useMyLocation = () => {
    setLocation(null);
    geo.request();
  };

  const addFiles = (e) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = '';
    setError('');

    if (files.length + selected.length > MAX_FILES) {
      setError(`You can attach up to ${MAX_FILES} files.`);
      return;
    }
    const tooBig = selected.find((f) => f.size > MAX_FILE_MB * 1024 * 1024);
    if (tooBig) {
      setError(`${tooBig.name} is larger than ${MAX_FILE_MB} MB.`);
      return;
    }

    setFiles((prev) => [
      ...prev,
      ...selected.map((file) => ({ file, url: URL.createObjectURL(file), kind: file.type.split('/')[0] })),
    ]);
  };

  const removeFile = (index) => {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const canContinue = (step === 0 && category) || (step === 1 && location) || step === 2;

  const submit = async () => {
    setError('');
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('latitude', String(location.latitude));
      formData.append('longitude', String(location.longitude));
      if (description.trim()) formData.append('description', description.trim());
      if (address.trim()) formData.append('address', address.trim());
      files.forEach((f) => formData.append('media', f.file));

      const result = await incidentApi.create(formData);
      navigate(`/citizen/track/${result.incidentId}`, {
        replace: true,
        state: { justReported: true, referenceId: result.referenceId, merged: result.merged },
      });
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => (step === 0 ? navigate(-1) : setStep(step - 1))}
          className="grid h-9 w-9 place-items-center rounded-lg hover:bg-navy-800"
          aria-label="Back"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Report Emergency</h1>
      </div>

      <ol className="grid grid-cols-4 gap-2" aria-label="Report steps">
        {STEPS.map((label, i) => (
          <li key={label}>
            <div className={`h-1.5 rounded-full ${i <= step ? 'bg-accent' : 'bg-navy-700'}`} />
            <p className={`mt-1 text-xs ${i === step ? 'font-semibold text-fg' : 'text-muted'}`}>{label}</p>
          </li>
        ))}
      </ol>

      {error && (
        <p className="rounded-lg border border-critical/40 bg-critical/10 px-3 py-2 text-sm text-critical" role="alert">
          {error}
        </p>
      )}

      {step === 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">What is happening?</h2>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                aria-pressed={category === key}
                className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm font-semibold transition ${
                  category === key ? 'border-accent bg-accent/10' : 'border-navy-700 bg-navy-900'
                }`}
              >
                <span className="text-xl" aria-hidden="true">{meta.emoji}</span>
                {meta.label}
              </button>
            ))}
          </div>
          <EmergencyCallBanner />
        </section>
      )}

      {step === 1 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Where is it?</h2>
          <button
            type="button"
            onClick={useMyLocation}
            disabled={geo.loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-accent/50 py-2.5 text-sm font-semibold text-accent disabled:opacity-60"
          >
            <Crosshair size={16} />
            {geo.loading ? 'Getting your location...' : 'Use my current location'}
          </button>
          {geo.error && <p className="text-sm text-high">{geo.error}</p>}

          <LocationPicker value={location} onChange={setLocation} />
          <p className="text-xs text-muted">Tap the map or drag the pin to adjust the exact spot.</p>

          {location && (
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <MapPin size={14} /> {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
            </p>
          )}

          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            maxLength={300}
            placeholder="Address or landmark (optional)"
            className="w-full rounded-lg border border-navy-700 bg-navy-950 px-3 py-2.5 outline-none focus:border-accent"
          />
        </section>
      )}

      {step === 2 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Tell us more</h2>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={5}
            placeholder="What happened? Is anyone injured or trapped? You can write in English, Urdu or Roman Urdu."
            className="w-full rounded-lg border border-navy-700 bg-navy-950 px-3 py-2.5 outline-none focus:border-accent"
          />
          <p className="text-right text-xs text-muted">{description.length}/2000</p>

          {files.length < MAX_FILES && (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-navy-700 py-4 text-sm font-semibold text-muted hover:border-accent/50">
              <ImagePlus size={18} />
              Add photo, video or voice note ({files.length}/{MAX_FILES})
              <input type="file" accept={ACCEPTED_TYPES} multiple onChange={addFiles} className="hidden" />
            </label>
          )}

          {files.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {files.map((f, i) => (
                <div key={f.url} className="relative">
                  {f.kind === 'image' && <img src={f.url} alt={`Attachment ${i + 1}`} className="aspect-square w-full rounded-lg object-cover" />}
                  {f.kind === 'video' && <video src={f.url} className="aspect-square w-full rounded-lg bg-black object-cover" muted />}
                  {f.kind === 'audio' && (
                    <div className="grid aspect-square w-full place-items-center rounded-lg bg-navy-800 text-xs text-muted">Voice note</div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-navy-950/90"
                    aria-label={`Remove attachment ${i + 1}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {step === 3 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Check and send</h2>
          <dl className="space-y-3 rounded-xl border border-navy-700 bg-navy-900 p-4 text-sm">
            <div>
              <dt className="text-muted">Type</dt>
              <dd className="font-semibold">
                {CATEGORY_META[category]?.emoji} {CATEGORY_META[category]?.label}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Location</dt>
              <dd className="font-semibold">
                {address || `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Details</dt>
              <dd>{description || <span className="text-muted">No description</span>}</dd>
            </div>
            <div>
              <dt className="text-muted">Attachments</dt>
              <dd>{files.length ? `${files.length} file(s)` : 'None'}</dd>
            </div>
            <div className="flex items-center gap-1.5 text-muted">
              <Clock size={14} /> {formatDateTime(reportedAt)}
            </div>
          </dl>

          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-critical py-4 text-lg font-extrabold text-white disabled:opacity-60"
          >
            <Send size={20} />
            {submitting ? 'Sending...' : 'Send Emergency Report'}
          </button>
        </section>
      )}

      {step < 3 && (
        <button
          type="button"
          onClick={() => setStep(step + 1)}
          disabled={!canContinue}
          className="w-full rounded-xl bg-accent py-3 font-bold text-navy-950 disabled:opacity-40"
        >
          Continue
        </button>
      )}
    </div>
  );
}