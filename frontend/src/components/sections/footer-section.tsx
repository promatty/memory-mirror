export function FooterSection() {
  return (
    <footer className="bg-background px-6 py-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 border-t border-border pt-8">
        <p className="text-muted-foreground text-sm">© 2025 Memory Mirror. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="text-muted-foreground hover:text-foreground text-sm" data-clickable>
            Privacy
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground text-sm" data-clickable>
            Terms
          </a>
        </div>
      </div>
    </footer>
  )
}
