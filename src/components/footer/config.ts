export type FooterNavItem = {
  titleKey: string
  href: string
}

export type FooterSection = {
  titleKey: string
  items: FooterNavItem[]
}

export const footerConfig = {
  sections: [
    {
      titleKey: 'footer.sections.products.title',
      items: [
        { titleKey: 'footer.sections.products.items.smsPlatform', href: '/' },
        { titleKey: 'footer.sections.products.items.apiDocs', href: '/api' },
        { titleKey: 'footer.sections.products.items.dashboard', href: '/app/dashboard' },
        { titleKey: 'footer.sections.products.items.pricing', href: '' },
      ],
    },
    {
      titleKey: 'footer.sections.support.title',
      items: [
        { titleKey: 'footer.sections.support.items.helpCenter', href: '/help' },
        { titleKey: 'footer.sections.support.items.integrationGuide', href: '/api' },
        { titleKey: 'footer.sections.support.items.faq', href: '/help' },
      ],
    },
    {
      titleKey: 'footer.sections.company.title',
      items: [
        { titleKey: 'footer.sections.company.items.about', href: '/about' },
        { titleKey: 'footer.sections.company.items.blog', href: '/blog' },
        { titleKey: 'footer.sections.company.items.contact', href: '/about' },
        { titleKey: 'footer.sections.company.items.terms', href: '' },
        { titleKey: 'footer.sections.company.items.privacy', href: '' },
      ],
    },
    {
      titleKey: 'footer.sections.resources.title',
      items: [
        { titleKey: 'footer.sections.resources.items.countryLibrary', href: '/api' },
        { titleKey: 'footer.sections.resources.items.projectList', href: '/api' },
        { titleKey: 'footer.sections.resources.items.callbackDocs', href: '/api' },
        { titleKey: 'footer.sections.resources.items.statusPage', href: '' },
        { titleKey: 'footer.sections.resources.items.security', href: '/about' },
      ],
    },
  ],
}
