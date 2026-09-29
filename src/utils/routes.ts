export const pageIdFromHash = (hash: string) => {
    const id = hash.replace(/^#\/?/, '').split('?')[0] || 'home'
    return id === 'clients' ? 'hearst' : id
}

export const sectionIdFromHash = (hash: string) =>
    new URLSearchParams(hash.split('?')[1] ?? '').get('section')

export const pageHref = (pageId: string) =>
    pageId === 'home' ? '#/' : `#/${pageId}`

export const teamPageHref = (teamId: string, section = '') =>
    `#/${teamId}${section ? `-${section}` : ''}`
