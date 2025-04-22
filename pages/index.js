import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const Hero = dynamic(() => import('../components/Hero'), { ssr: false });
const ProjectCard = dynamic(() => import('../components/ProjectCard'), { ssr: false });
const Contact = dynamic(() => import('../components/Contact'), { ssr: false });
const AdminModal = dynamic(() => import('../components/AdminModal'), { ssr: false });
const Navbar = dynamic(() => import('../components/Navbar'), { ssr: false });
const Section = dynamic(() => import('../components/Section'), { ssr: false });
const Footer = dynamic(() => import('../components/Footer'), { ssr: false });
import { connectToDatabase } from '../lib/mongodb';

export default function Home({ initialProjects, initialCategories, initialHero, initialAbout, initialContact }) {
  const [projects, setProjects] = useState(initialProjects);
  const [categories, setCategories] = useState(initialCategories);
  const [heroData, setHeroData] = useState(initialHero);
  const [aboutData, setAboutData] = useState(initialAbout);
  const [contactData, setContactData] = useState(initialContact);
  const [expandedCategories, setExpandedCategories] = useState({}); // Track expanded/collapsed state

  const fetchProjects = async () => {
    const res = await fetch('/api/projects');
    const data = await res.json();
    setProjects(data);
  };

  const fetchCategories = async () => {
    const res = await fetch('/api/categories');
    const data = await res.json();
    setCategories(data);
    // Initialize all categories as collapsed by default (showing only 3 projects)
    const initialExpanded = data.reduce((acc, category) => {
      acc[category.name || category] = false;
      return acc;
    }, {});
    setExpandedCategories(initialExpanded);
  };

  const fetchHero = async () => {
    const res = await fetch('/api/hero');
    const data = await res.json();
    setHeroData(data);
  };

  const fetchAbout = async () => {
    const res = await fetch('/api/about');
    const data = await res.json();
    setAboutData(data);
  };

  const fetchContact = async () => {
    const res = await fetch('/api/contact');
    const data = await res.json();
    setContactData(data);
  };

  const handleAddProject = async (project) => {
    // Ensure backward compatibility
    if (!project.shortDescription && project.description) {
      project.shortDescription = project.description;
      project.longDescription = project.description;
    }
    
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    await fetchProjects();
  };

  const handleEditProject = async (id, project) => {
    // Ensure backward compatibility
    if (!project.shortDescription && project.description) {
      project.shortDescription = project.description;
      project.longDescription = project.description;
    }
    
    await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    await fetchProjects();
  };

  const handleDeleteProject = async (id) => {
    await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
    });
    await fetchProjects();
  };

  const handleAddCategory = async (category) => {
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: category }),
    });
    await fetchCategories();
  };

  const handleUpdateHero = async (data) => {
    await fetch('/api/hero', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await fetchHero();
  };

  const handleUpdateAbout = async (data) => {
    await fetch('/api/about', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await fetchAbout();
  };

  const handleUpdateContact = async (data) => {
    await fetch('/api/contact', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await fetchContact();
  };

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  useEffect(() => {
    fetchProjects();
    fetchCategories();
    fetchHero();
    fetchAbout();
    fetchContact();
  }, []);

  // Update expandedCategories when categories change
  useEffect(() => {
    if (categories.length > 0) {
      const initialExpanded = categories.reduce((acc, category) => {
        acc[category.name || category] = false; // Show only 3 projects by default
        return acc;
      }, {});
      setExpandedCategories(initialExpanded);
    }
  }, [categories]);

  const groupedProjects = categories.reduce((acc, category) => {
    acc[category.name] = projects.filter((p) => p.category === category._id);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background dark:bg-zinc-900 text-gray-900 dark:text-zinc-100">
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <Hero heroData={heroData} onUpdateHero={handleUpdateHero} />
        
        {/* Projects Section */}
        <Section 
          id="projects" 
          title="Featured Projects" 
          description="Explore my latest work and innovations"
          className="py-12"
        >
          <div className="bg-white dark:bg-zinc-800 shadow-sm rounded-lg p-4">
            {Object.entries(groupedProjects).map(([categoryName, projects]) => (
              projects.length > 0 && (
                <div key={categoryName} className="mb-16 last:mb-0">
                  <h3 
                    className="text-heading-3 font-bold mb-6 tracking-widest uppercase text-gray-500 dark:text-zinc-400"
                  >
                    {categoryName}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {expandedCategories[categoryName] 
                      ? projects.map((project) => (
                          <div key={project._id} className="flex flex-col h-full">
                            <ProjectCard project={project} />
                          </div>
                        ))
                      : projects.slice(0, 3).map((project) => (
                          <div key={project._id} className="flex flex-col h-full">
                            <ProjectCard project={project} />
                          </div>
                        ))
                    }
                  </div>
                  {projects.length > 3 && (
                    <div className="mt-8 text-center">
                      <button
                        onClick={() => toggleCategory(categoryName)}
                        className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                      >
                        <span>{expandedCategories[categoryName] ? 'Show Less' : `View All ${projects.length} Projects`}</span>
                        <svg 
                          className={`w-5 h-5 transition-transform duration-300 ${expandedCategories[categoryName] ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )
            ))}
          </div>
        </Section>

        {/* About Section - Moved down and made more compact */}
        <Section 
          id="about" 
          title="About Me" 
          className="bg-gray-50 dark:bg-zinc-800/50"
        >
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div className="md:col-span-2 text-center md:text-left">
                <div 
                  className="prose prose-lg dark:prose-invert text-gray-600 dark:text-zinc-300"
                  dangerouslySetInnerHTML={{ __html: aboutData.content }}
                />
              </div>
              <div className="flex justify-center md:justify-end">
                <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-primary-500/20">
                  <img
                    src={aboutData.image || "/images/profile.jpg"}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </Section>
        
        {/* Contact Section */}
        <Section id="contact">
          <Contact contactData={contactData} onUpdateContact={handleUpdateContact} />
        </Section>
      </main>
      
      <Footer />

      <AdminModal
        categories={categories}
        projects={projects}
        heroData={heroData}
        aboutData={aboutData}
        contactData={contactData}
        onAddProject={handleAddProject}
        onEditProject={handleEditProject}
        onDeleteProject={handleDeleteProject}
        onAddCategory={handleAddCategory}
        onUpdateHero={handleUpdateHero}
        onUpdateAbout={handleUpdateAbout}
        onUpdateContact={handleUpdateContact}
      />
    </div>
  );
}

export async function getServerSideProps() {
  try {
    const { db } = await connectToDatabase();
    
    // Fetch data with error handling for each collection
    let projects = [];
    let categories = [];
    let hero = {};
    let about = {};
    let contact = {};
    
    try {
      projects = await db.collection('projects').find({}).toArray();
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
    
    try {
      categories = await db.collection('categories').find({}).toArray();
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
    
    try {
      hero = await db.collection('hero').findOne({}) || {};
    } catch (error) {
      console.error('Error fetching hero:', error);
    }
    
    try {
      about = await db.collection('about').findOne({}) || {};
    } catch (error) {
      console.error('Error fetching about:', error);
    }
    
    try {
      contact = await db.collection('contact').findOne({}) || {};
    } catch (error) {
      console.error('Error fetching contact:', error);
    }

    return {
      props: {
        initialProjects: JSON.parse(JSON.stringify(projects)),
        initialCategories: JSON.parse(JSON.stringify(categories)),
        initialHero: JSON.parse(JSON.stringify(hero)),
        initialAbout: JSON.parse(JSON.stringify(about)),
        initialContact: JSON.parse(JSON.stringify(contact || { 
          emailPlaceholder: "Email", 
          messagePlaceholder: "Message", 
          submitText: "Send", 
          socialLinks: [
            { name: "LinkedIn", url: "https://linkedin.com" },
            { name: "GitHub", url: "https://github.com" },
            { name: "Instagram", url: "https://instagram.com" },
          ],
        })),
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    
    // Return fallback data if database connection fails
    return {
      props: {
        initialProjects: [],
        initialCategories: [],
        initialHero: {},
        initialAbout: {},
        initialContact: { 
          emailPlaceholder: "Email", 
          messagePlaceholder: "Message", 
          submitText: "Send", 
          socialLinks: [
            { name: "LinkedIn", url: "https://linkedin.com" },
            { name: "GitHub", url: "https://github.com" },
            { name: "Instagram", url: "https://instagram.com" },
          ],
        },
      },
    };
  }
}