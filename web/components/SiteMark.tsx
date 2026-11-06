// The site logo. Plain shapes, so it needs no font and stays sharp at any size.
// The sign is the rupee; the green leg below the flat line stands for the ₹2,000 limit.
// Colours come from globals.css, so it follows light and dark mode with the rest of the site.
export default function SiteMark() {
  return (
    <span className="site-mark" aria-hidden="true">
      <svg viewBox="2 2 28 28">
        <path d="M23.3 28.5H16.7L10.8 20.5H6.5V17.1H12.3C14.6 17.1 15.8 16 15.8 13.7H6.5V10.3H15.8C15.8 8 14.6 6.9 12.3 6.9H6.5V3.5H25.5V6.9H18.2C19.6 7.3 20.5 8.5 21 10.3H25.5V13.7H21.1C20.7 16.8 18.7 18.9 15.9 19.4Z" fill="var(--logo-saffron)" />
        <path d="M13.75 24.5H20.05L23.3 28.5H16.7Z" fill="var(--logo-green)" />
      </svg>
    </span>
  );
}
