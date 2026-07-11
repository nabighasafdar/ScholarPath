const SCHOOLS = [
  "Crestview Institute of Technology",
  "Meridian State University",
  "Lakeshore College of Engineering",
  "Brightwell University",
  "Oakhaven Polytechnic",
  "Ashcombe University",
];

export function LogoSection() {
  return (
    <section className="border-b border-border py-16">
      <div className="mx-auto max-w-5xl px-6">
        <p className="text-center text-sm font-medium tracking-wide text-muted-foreground">
          Trusted by students at
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {SCHOOLS.map((school) => (
            <span
              key={school}
              className="text-lg font-medium tracking-tight text-muted-foreground/70"
            >
              {school}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
