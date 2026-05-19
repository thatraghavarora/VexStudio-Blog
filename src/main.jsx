import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Edit3,
  Eye,
  Gamepad2,
  LogIn,
  LogOut,
  MessageCircle,
  ImagePlus,
  Plus,
  Radio,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { seedPosts } from './seedPosts';
import './styles.css';

gsap.registerPlugin(ScrollTrigger);

const emptyPost = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: 'DEVLOG',
  cover_url: '/assets/vex-hero.png',
  read_time: 4,
  featured: false,
  published: true,
};

const defaultCategories = ['DEVLOG', 'PROTOCOLS', 'COMMLINK', 'UPLOAD'];

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function matchesSearch(post, searchTerm) {
  const value = searchTerm.trim().toLowerCase();
  if (!value) return true;
  return [post.title, post.slug, post.excerpt, post.content, post.category]
    .filter(Boolean)
    .some((field) => field.toLowerCase().includes(value));
}

function useCursorGlow() {
  useEffect(() => {
    const cursor = document.querySelector('.cursor-glow');
    const move = (event) => {
      cursor?.style.setProperty('--x', `${event.clientX}px`);
      cursor?.style.setProperty('--y', `${event.clientY}px`);
    };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, []);
}

function useRevealAnimations() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray('[data-reveal]').forEach((element, index) => {
        gsap.fromTo(
          element,
          { autoAlpha: 0, y: 34, scale: element.dataset.reveal === 'card' ? 0.96 : 1 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.85,
            delay: (index % 4) * 0.06,
            ease: 'power3.out',
            scrollTrigger: { trigger: element, start: 'top 86%' },
          },
        );
      });
    });
    return () => ctx.revert();
  }, []);
}

function usePosts() {
  const [posts, setPosts] = useState(seedPosts);
  const [loading, setLoading] = useState(true);
  const localKey = 'vex-studio-posts';

  const loadPosts = async (includeDrafts = false) => {
    setLoading(true);
    if (isSupabaseConfigured) {
      const query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      const { data, error } = includeDrafts ? await query : await query.eq('published', true);
      if (!error) setPosts(data?.length ? data : includeDrafts ? [] : seedPosts);
    } else {
      const saved = JSON.parse(localStorage.getItem(localKey) || 'null');
      const source = saved || seedPosts;
      setPosts(includeDrafts ? source : source.filter((post) => post.published));
    }
    setLoading(false);
  };

  const savePost = async (post) => {
    const payload = {
      ...post,
      slug: post.slug || slugify(post.title),
      read_time: Number(post.read_time) || 4,
    };

    if (isSupabaseConfigured) {
      const { id, ...insertable } = payload;
      const next = id ? payload : insertable;
      const { error } = await supabase.from('posts').upsert(next);
      if (error) throw error;
      await loadPosts(true);
      return;
    }

    const saved = JSON.parse(localStorage.getItem(localKey) || 'null') || seedPosts;
    const next = payload.id
      ? saved.map((item) => (item.id === payload.id ? payload : item))
      : [{ ...payload, id: crypto.randomUUID(), created_at: new Date().toISOString() }, ...saved];
    localStorage.setItem(localKey, JSON.stringify(next));
    setPosts(next);
  };

  const deletePost = async (id) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw error;
      await loadPosts(true);
      return;
    }
    const next = posts.filter((post) => post.id !== id);
    localStorage.setItem(localKey, JSON.stringify(next));
    setPosts(next);
  };

  return { posts, loading, loadPosts, savePost, deletePost };
}

function App() {
  useCursorGlow();
  const pathname = window.location.pathname;
  const isAdmin = pathname.startsWith('/admin');
  const isBlogsArchive = pathname === '/blogs';
  const isBlogPost = pathname.startsWith('/blog/');
  return (
    <>
      <div className="cursor-glow" />
      {isAdmin ? <AdminPanel /> : isBlogsArchive ? <BlogsArchive /> : isBlogPost ? <BlogPostPage slug={pathname.split('/blog/')[1]} /> : <BlogHome />}
    </>
  );
}

function BlogHome() {
  const { posts, loading, loadPosts } = usePosts();
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  useRevealAnimations();

  useEffect(() => {
    loadPosts(false);
  }, []);

  const categories = useMemo(
    () => ['ALL', ...Array.from(new Set(posts.map((post) => post.category).filter(Boolean)))],
    [posts],
  );
  const categoryPosts = activeCategory === 'ALL'
    ? posts
    : posts.filter((post) => post.category === activeCategory);
  const visiblePosts = categoryPosts.filter((post) => matchesSearch(post, searchTerm));
  const featured = useMemo(
    () => visiblePosts.find((post) => post.featured) || visiblePosts[0],
    [visiblePosts],
  );
  const regularPosts = visiblePosts.filter((post) => post.id !== featured?.id);

  return (
    <main>
      <Nav />
      <section className="hero">
        <img className="hero-media" src="/assets/vex-hero.png" alt="Dark game studio environment" />
        <div className="hero-shade" />
        <div className="hero-grid">
          <p className="signal" data-reveal>BLOG / BLOGS / GAME UPDATES</p>
          <h1 data-reveal>VEX STUDIO BLOG</h1>
          <p className="hero-copy" data-reveal>
            Latest game updates, best game stories, studio news, and behind-the-scenes
            posts from VEX Studio.
          </p>
          <div className="hero-actions" data-reveal>
            <a className="btn primary clipped" href="#posts">
              Read Blogs <ArrowRight size={18} />
            </a>
          </div>
        </div>
        <div className="watermark">VEX</div>
      </section>

      {featured && (
        <section className="feature-band" id="posts">
          <a className="feature-card" href={`/blog/${featured.slug}`} data-reveal="card">
            <div>
              <p className="signal">FEATURED POST</p>
              <h2>{featured.title}</h2>
              <p>{featured.excerpt}</p>
              <div className="meta-row">
                <span><CalendarDays size={16} /> {new Date(featured.created_at).toLocaleDateString()}</span>
                <span><BookOpen size={16} /> {featured.read_time} min read</span>
              </div>
            </div>
            <div className="feature-terminal">
              <span>BUILD STATUS</span>
              <strong>ACTIVE</strong>
              <p>{featured.content}</p>
            </div>
          </a>
        </section>
      )}

      <section className="posts-section">
        <div className="section-head" data-reveal>
          <div>
            <p className="signal">ARCHIVE / PROTOCOLS</p>
            <h2>Field Notes</h2>
          </div>
          <div className="archive-tools">
            <label className="search-box">
              <Search size={16} />
              <input
                placeholder="Search blogs"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
            <select value={activeCategory} onChange={(event) => setActiveCategory(event.target.value)}>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
            <span>{loading ? 'Syncing database...' : `${visiblePosts.length} transmissions online`}</span>
          </div>
        </div>
        <div className="post-grid">
          {regularPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
        {!loading && visiblePosts.length === 0 && (
          <div className="empty-feed" data-reveal>
            <p className="signal">NO POSTS</p>
            <h3>No published posts yet.</h3>
          </div>
        )}
      </section>

      <CommunitySection />
    </main>
  );
}

function BlogsArchive() {
  const { posts, loading, loadPosts } = usePosts();
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  useRevealAnimations();

  useEffect(() => {
    loadPosts(false);
  }, []);

  const categories = useMemo(
    () => ['ALL', ...Array.from(new Set(posts.map((post) => post.category).filter(Boolean)))],
    [posts],
  );
  const categoryPosts = activeCategory === 'ALL'
    ? posts
    : posts.filter((post) => post.category === activeCategory);
  const visiblePosts = categoryPosts.filter((post) => matchesSearch(post, searchTerm));
  const featuredPosts = visiblePosts.filter((post) => post.featured);

  return (
    <main>
      <Nav />
      <section className="archive-page">
        <div className="section-head" data-reveal>
          <div>
            <p className="signal">DIRECT / BLOGS</p>
            <h1>All Blogs</h1>
          </div>
          <div className="archive-tools">
            <label className="search-box">
              <Search size={16} />
              <input
                placeholder="Search blogs"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
            <select value={activeCategory} onChange={(event) => setActiveCategory(event.target.value)}>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </div>
        </div>

        {featuredPosts.length > 0 && (
          <div className="archive-block" data-reveal>
            <p className="signal">FEATURED BLOGS</p>
            <div className="post-grid">
              {featuredPosts.map((post) => <PostCard key={post.id} post={post} />)}
            </div>
          </div>
        )}

        <div className="archive-block" data-reveal>
          <p className="signal">{loading ? 'SYNCING' : `${visiblePosts.length} POSTS`}</p>
          <div className="post-grid">
            {visiblePosts.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
          {!loading && visiblePosts.length === 0 && (
            <div className="empty-feed">
              <p className="signal">NO POSTS</p>
              <h3>No matching published posts.</h3>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function BlogPostPage({ slug }) {
  const { posts, loading, loadPosts } = usePosts();
  useRevealAnimations();

  useEffect(() => {
    loadPosts(false);
  }, []);

  const post = posts.find((item) => item.slug === decodeURIComponent(slug || ''));

  if (!post && loading) {
    return (
      <main>
        <Nav />
        <section className="post-detail empty-state">
          <p className="signal">DATABASE / SYNC</p>
          <h1>Loading Transmission</h1>
        </section>
      </main>
    );
  }

  if (!post) {
    return (
      <main>
        <Nav />
        <section className="post-detail empty-state">
          <p className="signal">404 / SIGNAL LOST</p>
          <h1>Transmission Not Found</h1>
          <a className="btn primary clipped" href="/">Back To Blog</a>
        </section>
      </main>
    );
  }

  return (
    <main>
      <Nav />
      <article className="post-detail">
        <img className="detail-cover" src={post.cover_url || '/assets/vex-hero.png'} alt="" />
        <div className="detail-shell" data-reveal>
          <a className="signal" href="/">BACK / {post.category}</a>
          <h1>{post.title}</h1>
          <p className="detail-excerpt">{post.excerpt}</p>
          <div className="meta-row">
            <span><CalendarDays size={16} /> {new Date(post.created_at).toLocaleDateString()}</span>
            <span><BookOpen size={16} /> {post.read_time} min read</span>
            <span><Radio size={16} /> {post.slug}</span>
          </div>
          <div className="detail-content">
            {post.content.split('\n').filter(Boolean).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </article>
    </main>
  );
}

function Nav() {
  return (
    <nav className="topbar">
      <a className="brand" href="/">
        <Gamepad2 size={22} /> VEX<span>STUDIO</span>
      </a>
      <div>
        <a href="https://vexstudio.xyz/">Home</a>
        <a href="https://store.vexstudio.xyz/">Store</a>
        <a href="https://vexstudio.xyz/#contact-us">Contact Us</a>
      </div>
    </nav>
  );
}

function PostCard({ post }) {
  return (
    <a className="post-card" href={`/blog/${post.slug}`} data-reveal="card">
      <div className="corner top-left" />
      <div className="corner bottom-right" />
      <img src={post.cover_url || '/assets/vex-hero.png'} alt="" />
      <div className="post-body">
        <span className="tag">{post.category}</span>
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
        <div className="meta-row">
          <span><BookOpen size={15} /> {post.read_time} min</span>
          <span><Radio size={15} /> ONLINE</span>
        </div>
      </div>
    </a>
  );
}

function CommunitySection() {
  return (
    <section className="community" id="community">
      <div className="watermark team">TEAM</div>
      <div className="community-copy" data-reveal>
        <p className="signal">COMMLINK / COMMUNITY</p>
        <h2>Join The Build Room</h2>
        <p>
          Patch notes, prototype drops, playtest calls, and production logs for people
          who want to watch the horror game take shape.
        </p>
      </div>
      <div className="community-actions" data-reveal="card">
        <a className="social whatsapp" href="https://wa.me/" target="_blank" rel="noreferrer">
          <MessageCircle size={20} /> WhatsApp Community
        </a>
        <a className="social discord" href="https://discord.com/" target="_blank" rel="noreferrer">
          <Radio size={20} /> Discord Protocol
        </a>
      </div>
    </section>
  );
}

function AdminPanel() {
  const { posts, loadPosts, savePost, deletePost } = usePosts();
  const [session, setSession] = useState(null);
  const [auth, setAuth] = useState({ email: '', password: '' });
  const [form, setForm] = useState(emptyPost);
  const [newCategory, setNewCategory] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    loadPosts(true);
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      loadPosts(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const categories = useMemo(() => {
    return Array.from(new Set([...defaultCategories, ...posts.map((post) => post.category).filter(Boolean)]));
  }, [posts]);

  const canEdit = !isSupabaseConfigured || session;

  const signIn = async (event) => {
    event.preventDefault();
    setStatus('Checking credentials...');
    const { error } = await supabase.auth.signInWithPassword(auth);
    setStatus(error ? error.message : 'Admin access granted.');
  };

  const signOut = () => {
    if (isSupabaseConfigured) supabase.auth.signOut();
    setSession(null);
    setForm(emptyPost);
    setStatus('Admin locked.');
  };

  const useNewCategory = () => {
    const category = newCategory.trim().toUpperCase();
    if (!category) return;
    setForm({ ...form, category });
    setNewCategory('');
  };

  const handleThumbnailFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, cover_url: reader.result }));
    reader.readAsDataURL(file);
  };

  const submitPost = async (event) => {
    event.preventDefault();
    setStatus('Uploading transmission...');
    try {
      await savePost(form);
      setForm(emptyPost);
      setStatus('Post synced successfully.');
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <main className="admin-shell">
      <Nav />
      <section className="admin-hero">
        <p className="signal">ADMIN / UPLOAD CONSOLE</p>
        <h1>Blog Control Room</h1>
        <p>Create horror game devlogs, community updates, GDD notes, and studio news.</p>
        <div className="admin-actions">
          <a className="status-pill" href="/blogs" target="_blank" rel="noreferrer">
            <BookOpen size={16} /> All Blogs
          </a>
          <div className="status-pill">
            <Eye size={16} /> {isSupabaseConfigured ? 'Supabase linked' : 'Local demo mode'}
          </div>
        </div>
      </section>

      {!canEdit && (
        <form className="login-panel" onSubmit={signIn}>
          <h2>Admin Login</h2>
          <input placeholder="Email" value={auth.email} onChange={(e) => setAuth({ ...auth, email: e.target.value })} />
          <input placeholder="Password" type="password" value={auth.password} onChange={(e) => setAuth({ ...auth, password: e.target.value })} />
          <button className="btn primary" type="submit"><LogIn size={18} /> Login</button>
        </form>
      )}

      {canEdit && (
        <section className="admin-grid">
          <form className="editor-panel" onSubmit={submitPost}>
            <div className="panel-title">
              <h2>{form.id ? 'Update Blog' : 'New Blog'}</h2>
              <Plus size={20} />
            </div>
            <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: slugify(e.target.value) })} required />
            <input placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} required />
            <textarea placeholder="Excerpt" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} required />
            <textarea className="content-input" placeholder="Full post content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
            <div className="form-row">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
              <input type="number" min="1" value={form.read_time} onChange={(e) => setForm({ ...form, read_time: e.target.value })} />
            </div>
            <div className="form-row">
              <input placeholder="Create new category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
              <button className="btn ghost" type="button" onClick={useNewCategory}><Plus size={18} /> Use Category</button>
            </div>
            <input placeholder="Thumbnail image URL" value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} />
            <label className="upload-line">
              <ImagePlus size={18} />
              Add Thumbnail File
              <input type="file" accept="image/*" onChange={handleThumbnailFile} />
            </label>
            {form.cover_url && <img className="thumb-preview" src={form.cover_url} alt="Thumbnail preview" />}
            <label className="checkline"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured post</label>
            <label className="checkline"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Published</label>
            <button className="btn primary clipped" type="submit">
              <Save size={18} /> {form.id ? 'Update Post' : 'Save Post'}
            </button>
            {form.id && (
              <button className="btn ghost" type="button" onClick={() => setForm(emptyPost)}>
                <Plus size={18} /> New Post
              </button>
            )}
          </form>

          <div className="post-manager">
            <div className="panel-title">
              <h2>Database Posts</h2>
              <button className="icon-btn" type="button" onClick={signOut}><LogOut size={18} /></button>
            </div>
            {posts.map((post) => (
              <div className="manager-item" key={post.id}>
                <div>
                  <span className="tag">{post.category}</span>
                  <h3>{post.title}</h3>
                  <p>{post.published ? 'Published' : 'Draft'} / {post.slug}</p>
                </div>
                <div className="manager-actions">
                  <button className="mini-btn" type="button" onClick={() => setForm(post)}><Edit3 size={16} /> Edit</button>
                  <button className="mini-btn danger" type="button" onClick={() => deletePost(post.id)}><Trash2 size={16} /> Delete</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {status && <div className="toast">{status}</div>}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
