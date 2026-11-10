/** template של App Router — נטען מחדש בכל ניווט ומעניק מעבר עמוד חלק */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
