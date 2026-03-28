import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../lib/utils';

const Breadcrumb = ({ items = [], className }) => {
    if (!items || items.length === 0) return null;

    return (
        <nav 
            aria-label="Breadcrumb" 
            className={cn("flex items-center space-x-2 text-sm", className)}
        >
            <ol className="flex items-center space-x-2 list-none p-0 m-0">
                {/* Home icon as first item */}
                <li>
                    <Link 
                        to="/dashboard" 
                        className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Go to homepage"
                    >
                        <Home className="w-4 h-4" />
                    </Link>
                </li>
                
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    
                    return (
                        <li key={item.link || item.label} className="flex items-center">
                            {/* Separator */}
                            {!isLast && (
                                <ChevronRight 
                                    className="w-4 h-4 text-muted-foreground mx-2 flex-shrink-0" 
                                    aria-hidden="true"
                                />
                            )}
                            
                            {/* Current item */}
                            {isLast ? (
                                <span 
                                    className="text-foreground font-medium"
                                    aria-current="page"
                                >
                                    {item.label}
                                </span>
                            ) : (
                                <Link
                                    to={item.link}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {item.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumb;
