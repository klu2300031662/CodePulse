import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // We can't easily check localStorage here, so typically we rely on cookies.
  // For a simple SaaS MVP relying on localStorage purely for JWT, we might just 
  // do a client-side check in a wrapper component, BUT we can do basic protection 
  // here if we switch to storing tokens in cookies.
  // Alternatively, we let the client side handle it on mount. 
  
  // Example server side logic if utilizing cookies:
  // const token = request.cookies.get('token');
  // if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
  //   return NextResponse.redirect(new URL('/login', request.url));
  // }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
